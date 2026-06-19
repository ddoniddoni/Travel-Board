import type { DayPlan, PlaceCandidate, TripInput, TripPlan } from "./types";

const categoryByInterest: Record<string, PlaceCandidate["category"]> = {
  food: "food",
  cafe: "cafe",
  culture: "culture",
  shopping: "shopping",
  nature: "sightseeing",
};

const interestLabels: Record<string, string> = {
  food: "맛집",
  cafe: "카페",
  culture: "문화",
  shopping: "쇼핑",
  nature: "산책",
};

const paceLabels: Record<TripInput["preference"]["pace"], string> = {
  relaxed: "여유로운",
  balanced: "균형 잡힌",
  packed: "알찬",
};

const budgetLabels: Record<TripInput["preference"]["budgetLevel"], string> = {
  low: "절약형",
  medium: "보통 예산",
  high: "넉넉한 예산",
};

const defaultPlaces: PlaceCandidate[] = [
  {
    id: "local-market",
    name: "로컬 시장 골목",
    category: "food",
    area: "구시가지",
    durationMinutes: 75,
    description: "부담 없는 가격으로 현지 음식을 맛보기 좋은 점심 후보입니다.",
    tags: ["맛집", "로컬", "가성비"],
  },
  {
    id: "river-walk",
    name: "강변 산책로",
    category: "sightseeing",
    area: "강변",
    durationMinutes: 80,
    description: "식사와 카페 사이에 넣기 좋은 낮은 강도의 산책 코스입니다.",
    tags: ["산책", "전망", "여유"],
  },
  {
    id: "design-museum",
    name: "도시 디자인 뮤지엄",
    category: "culture",
    area: "미술관 지구",
    durationMinutes: 100,
    description: "비 오는 날에도 활용하기 좋은 실내 문화 일정입니다.",
    tags: ["문화", "실내", "비 오는 날"],
  },
  {
    id: "slow-cafe",
    name: "슬로우 로스터리 카페",
    category: "cafe",
    area: "중심가",
    durationMinutes: 60,
    description: "일정이 너무 빡빡해지지 않도록 쉬어가기 좋은 카페입니다.",
    tags: ["카페", "휴식", "커피"],
  },
  {
    id: "night-view",
    name: "야경 전망 포인트",
    category: "sightseeing",
    area: "언덕 공원",
    durationMinutes: 60,
    description: "하루를 마무리하기 좋은 가벼운 야경 코스입니다.",
    tags: ["야경", "전망", "사진"],
  },
];

function getDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dates: string[] = [];

  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    dates.push(day.toISOString().slice(0, 10));
  }

  return dates.length > 0 ? dates : [startDate];
}

function buildPlaces(input: TripInput): PlaceCandidate[] {
  const preferencePlaces = input.preference.interests
    .slice(0, 3)
    .map((interest, index) => {
      const category = categoryByInterest[interest] ?? "sightseeing";
      const label = interestLabels[interest] ?? interest;

      return {
        id: `preference-${interest}-${index}`,
        name: `${input.destination} ${label} 추천지`,
        category,
        area: index % 2 === 0 ? "중심가" : "역 근처",
        durationMinutes: category === "food" ? 75 : 90,
        description: `${label} 취향을 반영해 우선 후보로 넣은 mock 장소입니다.`,
        tags: [label, paceLabels[input.preference.pace]],
      };
    });

  return [...preferencePlaces, ...defaultPlaces];
}

function buildItems(
  day: number,
  places: PlaceCandidate[],
  pace: TripInput["preference"]["pace"],
) {
  const count = pace === "packed" ? 5 : pace === "relaxed" ? 3 : 4;
  const times = ["09:30", "11:30", "14:00", "16:30", "19:00"];
  const types = ["activity", "meal", "cafe", "activity", "rest"] as const;

  return Array.from({ length: count }, (_, index) => {
    const place = places[(day + index - 1) % places.length];

    return {
      id: `day-${day}-item-${index + 1}`,
      startTime: times[index],
      title: index === 1 ? `${place.area} 점심 시간` : place.name,
      type: types[index],
      placeId: place.id,
      durationMinutes: index === 1 ? 75 : place.durationMinutes,
      note:
        index === 0
          ? "하루의 기준점이 되는 장소로 먼저 배치했습니다."
          : "이 블록은 이후 채팅 요청으로 교체하거나 순서를 바꿀 수 있습니다.",
    };
  });
}

export function createMockTripPlan(input: TripInput): TripPlan {
  const dates = getDates(input.startDate, input.endDate).slice(0, 7);
  const places = buildPlaces(input);
  const interestText = input.preference.interests
    .map((interest) => interestLabels[interest] ?? interest)
    .join(", ");

  const days: DayPlan[] = dates.map((date, index) => ({
    day: index + 1,
    date,
    title:
      input.preference.pace === "relaxed"
        ? "여유를 둔 느린 코스"
        : input.preference.pace === "packed"
          ? "핵심 명소를 촘촘히 담은 코스"
          : "이동과 휴식을 균형 있게 둔 코스",
    summary: `${input.destination} ${index + 1}일차는 ${interestText} 취향을 중심으로 구성했습니다.`,
    items: buildItems(index + 1, places, input.preference.pace),
  }));

  return {
    id: `trip-${Date.now()}`,
    destination: input.destination,
    title: `${input.destination} ${dates.length}일 여행 보드`,
    styleSummary: `${paceLabels[input.preference.pace]} 속도, ${budgetLabels[input.preference.budgetLevel]}, ${interestText} 중심 일정입니다.`,
    input,
    days,
    places,
    qualityNotes: [
      "mock 일정에서도 식사, 휴식, 장소 후보를 분리해 이후 AI 응답으로 교체하기 쉽게 구성했습니다.",
      "장소 데이터는 Google Places API 연동 시 같은 구조로 대체할 수 있습니다.",
    ],
    chatMessages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function modifyMockTripPlan(message: string, tripPlan: TripPlan): TripPlan {
  const lower = message.toLowerCase();
  const relaxed =
    message.includes("여유") || lower.includes("relax") || lower.includes("slow");
  const food =
    message.includes("맛집") || message.includes("식당") || lower.includes("food");
  const rainy =
    message.includes("비") || message.includes("우천") || lower.includes("rain");

  const days = tripPlan.days.map((day) => {
    let items = [...day.items];

    if (relaxed) {
      items = items.slice(0, Math.max(3, items.length - 1));
      items = items.map((item) => ({
        ...item,
        note: "이동 부담을 줄이고 머무는 시간을 늘리는 방향으로 조정했습니다.",
      }));
    }

    if (food) {
      items = items.map((item, index) =>
        index === 1
          ? {
              ...item,
              title: `${tripPlan.destination} 로컬 맛집 중심 식사`,
              type: "meal" as const,
              note: "맛집 탐색 비중을 높이도록 식사 블록을 강화했습니다.",
            }
          : item,
      );
    }

    if (rainy) {
      items = items.map((item) =>
        item.type === "activity"
          ? {
              ...item,
              title: `${item.title} 실내 대안`,
              note: "비 오는 날에도 진행하기 쉽도록 실내 또는 지붕 있는 장소를 우선했습니다.",
            }
          : item,
      );
    }

    return {
      ...day,
      title: relaxed
        ? "여유롭게 다시 조정한 코스"
        : food
          ? "맛집 비중을 높인 코스"
          : rainy
            ? "비 오는 날 플랜B"
            : "요청을 반영한 수정 코스",
      summary: `수정 요청을 반영했습니다: ${message}`,
      items,
    };
  });

  return {
    ...tripPlan,
    days,
    qualityNotes: [
      `mock 수정 요청 반영: ${message}`,
      "다음 단계에서는 AI가 같은 TripPlan 스키마로 수정 결과를 반환하게 됩니다.",
    ],
    updatedAt: new Date().toISOString(),
  };
}
