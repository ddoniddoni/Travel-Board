import "server-only";

import type { PlaceCandidate, TripInput } from "@/features/trip-planner/types";

export type PlaceSearchRequest = Pick<TripInput, "destination" | "preference"> & {
  limit?: number;
};

export type PlacesProvider = {
  searchPlaces: (request: PlaceSearchRequest) => Promise<PlaceCandidate[]>;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
};

const GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
].join(",");
const MAX_REAL_SEARCH_RESULTS = 3;
const DEFAULT_DAILY_REQUEST_LIMIT = 10;

const categoryByInterest: Record<string, PlaceCandidate["category"]> = {
  food: "food",
  cafe: "cafe",
  culture: "culture",
  shopping: "shopping",
  nature: "sightseeing",
};

const categoryByGoogleType: Record<string, PlaceCandidate["category"]> = {
  cafe: "cafe",
  coffee_shop: "cafe",
  restaurant: "food",
  bakery: "food",
  bar: "food",
  museum: "culture",
  art_gallery: "culture",
  cultural_center: "culture",
  shopping_mall: "shopping",
  store: "shopping",
  park: "sightseeing",
  tourist_attraction: "sightseeing",
};

const interestLabels: Record<string, string> = {
  food: "맛집",
  cafe: "카페",
  culture: "문화",
  shopping: "쇼핑",
  nature: "자연",
};

const fallbackPlaces: PlaceCandidate[] = [
  {
    id: "local-market",
    name: "로컬 시장 골목",
    category: "food",
    area: "구시가지",
    durationMinutes: 75,
    description: "부담 없는 가격으로 지역 음식을 맛보기 좋은 시장 정보입니다.",
    tags: ["맛집", "로컬", "가성비"],
  },
  {
    id: "river-walk",
    name: "강변 산책로",
    category: "sightseeing",
    area: "강변",
    durationMinutes: 80,
    description: "식사와 카페 사이에 걷기 좋은 여유로운 산책 코스입니다.",
    tags: ["산책", "풍경", "여유"],
  },
  {
    id: "design-museum",
    name: "전시 디자인 뮤지엄",
    category: "culture",
    area: "미술관 지구",
    durationMinutes: 100,
    description: "비 오는 날에도 이용하기 좋은 실내 문화 일정입니다.",
    tags: ["문화", "실내", "비 오는 날"],
  },
  {
    id: "slow-cafe",
    name: "슬로우 로스터리 카페",
    category: "cafe",
    area: "중심가",
    durationMinutes: 60,
    description: "여행 일정 사이에 휴식하기 좋은 카페입니다.",
    tags: ["카페", "휴식", "커피"],
  },
  {
    id: "night-view",
    name: "야경 산책 스팟",
    category: "sightseeing",
    area: "언덕 공원",
    durationMinutes: 60,
    description: "하루를 마무리하기 좋은 가벼운 야경 코스입니다.",
    tags: ["야경", "산책", "사진"],
  },
];

let requestCountDate = "";
let requestCount = 0;

export const mockPlacesTool: PlacesProvider = {
  async searchPlaces({ destination, preference, limit = 8 }) {
    const preferredPlaces = preference.interests.slice(0, 3).map((interest, index) => {
      const category = categoryByInterest[interest] ?? "sightseeing";

      return {
        id: `mock-${destination}-${interest}-${index}`,
        name: `${destination} ${interestLabels[interest] ?? interest} 추천지`,
        category,
        area: index % 2 === 0 ? "중심가" : "숙소 근처",
        durationMinutes: category === "food" ? 75 : 90,
        description: `${interestLabels[interest] ?? interest} 취향을 반영한 mock 장소 정보입니다.`,
        tags: [interest, preference.pace],
      } satisfies PlaceCandidate;
    });

    return [...preferredPlaces, ...fallbackPlaces]
      .slice(0, limit)
      .map((place, index) => ({
        ...place,
        provider: "mock" as const,
        coordinates: { lat: 37.56 + index * 0.006, lng: 126.97 + index * 0.008 },
        address: `${destination} ${place.area}`,
        openingHoursSummary: "영업시간은 실제 Places API 연결 후 확인됩니다.",
      }));
  },
};

const googlePlacesTool: PlacesProvider = {
  async searchPlaces({ destination, preference, limit = MAX_REAL_SEARCH_RESULTS }) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not configured.");

    consumeDailyRequestQuota();
    const searchText = [destination, ...preference.interests.map((interest) => interestLabels[interest] ?? interest)].join(" ");
    const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: searchText,
        languageCode: "ko",
        maxResultCount: Math.min(limit, MAX_REAL_SEARCH_RESULTS),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new Error(
        `Google Places text search failed with status ${response.status}: ${detail?.error?.message ?? "Unknown Google API error."}`,
      );
    }

    const data = (await response.json()) as GoogleTextSearchResponse;
    return (data.places ?? []).flatMap((place, index) => toPlaceCandidate(place, index));
  },
};

export async function searchPlaces(request: PlaceSearchRequest): Promise<PlaceCandidate[]> {
  return getPlacesProvider().searchPlaces(request);
}

function getPlacesProvider(): PlacesProvider {
  if (process.env.USE_MOCK_PLACES === "false" && process.env.GOOGLE_MAPS_API_KEY) {
    return googlePlacesTool;
  }

  return mockPlacesTool;
}

function consumeDailyRequestQuota() {
  const today = new Date().toISOString().slice(0, 10);
  if (requestCountDate !== today) {
    requestCountDate = today;
    requestCount = 0;
  }

  const limit = readPositiveInteger(
    process.env.PLACES_DAILY_REQUEST_LIMIT,
    DEFAULT_DAILY_REQUEST_LIMIT,
  );
  if (requestCount >= limit) {
    throw new Error(`Daily Places request limit (${limit}) reached.`);
  }

  requestCount += 1;
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toPlaceCandidate(place: GooglePlace, index: number): PlaceCandidate[] {
  const id = place.id;
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!id || !name || typeof lat !== "number" || typeof lng !== "number") return [];

  const category = categoryByGoogleType[place.primaryType ?? ""] ?? "sightseeing";
  return [{
    id: `google-${id}`,
    providerPlaceId: id,
    provider: "google",
    name,
    category,
    area: place.formattedAddress ?? "주소 정보 없음",
    address: place.formattedAddress,
    durationMinutes: category === "food" ? 75 : category === "cafe" ? 60 : 90,
    description: "Google Places 검색 결과를 기반으로 한 장소 정보입니다.",
    tags: [place.primaryType ?? "place", `검색 ${index + 1}`],
    coordinates: { lat, lng },
  }];
}
