import "server-only";

import type { PlaceCandidate, TripInput } from "@/features/trip-planner/types";

export type PlaceSearchRequest = Pick<TripInput, "destination" | "preference"> & {
  limit?: number;
};

export type PlacesProvider = {
  searchPlaces: (request: PlaceSearchRequest) => Promise<PlaceCandidate[]>;
};

const categoryByInterest: Record<string, PlaceCandidate["category"]> = {
  food: "food",
  cafe: "cafe",
  culture: "culture",
  shopping: "shopping",
  nature: "sightseeing",
};

const fallbackPlaces: PlaceCandidate[] = [
  {
    id: "local-market",
    name: "로컬 시장 골목",
    category: "food",
    area: "구시가지",
    durationMinutes: 75,
    description: "부담 없는 가격으로 현지 음식을 맛보기 좋은 시장입니다.",
    tags: ["맛집", "로컬", "가성비"],
  },
  {
    id: "river-walk",
    name: "강변 산책로",
    category: "sightseeing",
    area: "강변",
    durationMinutes: 80,
    description: "식사와 카페 사이에 걷기 좋은 여유로운 산책 코스입니다.",
    tags: ["산책", "야경", "여유"],
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

export const mockPlacesTool: PlacesProvider = {
  async searchPlaces({ destination, preference, limit = 8 }) {
    const preferredPlaces = preference.interests.slice(0, 3).map((interest, index) => {
      const category = categoryByInterest[interest] ?? "sightseeing";

      return {
        id: `mock-${destination}-${interest}-${index}`,
        name: `${destination} ${interest} 추천지`,
        category,
        area: index % 2 === 0 ? "중심가" : "숙소 근처",
        durationMinutes: category === "food" ? 75 : 90,
        description: `${interest} 취향을 반영한 mock 장소 후보입니다.`,
        tags: [interest, preference.pace],
      } satisfies PlaceCandidate;
    });

    return [...preferredPlaces, ...fallbackPlaces].slice(0, limit);
  },
};

function getPlacesProvider(): PlacesProvider {
  // Google Places 연결 시 이 지점에서 환경 변수에 따라 실제 공급자로 교체한다.
  return mockPlacesTool;
}

export async function searchPlaces(
  request: PlaceSearchRequest,
): Promise<PlaceCandidate[]> {
  return getPlacesProvider().searchPlaces(request);
}
