import "server-only";
import { generateObject } from "ai";
import { getTripPlannerModel } from "@/lib/ai/model";
import { tripGenerationPrompt, tripModificationPrompt } from "./prompts";
import { modifyTripResponseSchema, tripPlanSchema } from "./schemas";
import type { PlaceCandidate, TripInput, TripPlan } from "./types";

export async function generateTripPlanWithAI(
  input: TripInput,
  placeCandidates: PlaceCandidate[],
): Promise<TripPlan> {
  const { object } = await generateObject({
    model: getTripPlannerModel(),
    schema: tripPlanSchema,
    schemaName: "TripPlan",
    schemaDescription:
      "AI Travel Board UI에서 바로 사용할 수 있는 구조화된 여행 일정 데이터",
    system: tripGenerationPrompt,
    prompt: buildTripGenerationUserPrompt(input, placeCandidates),
    temperature: 0.4,
  });

  const candidateIds = new Set(placeCandidates.map((place) => place.id));
  const hasUnknownPlace = object.days.some((day) =>
    day.items.some((item) => item.placeId && !candidateIds.has(item.placeId)),
  );
  if (hasUnknownPlace) {
    throw new Error("AI itinerary referenced a place outside the verified candidates.");
  }

  return tripPlanSchema.parse({
    ...object,
    id: object.id || `trip-${Date.now()}`,
    input,
    places: placeCandidates,
    chatMessages: [],
    updatedAt: new Date().toISOString(),
  });
}

function buildTripGenerationUserPrompt(
  input: TripInput,
  placeCandidates: PlaceCandidate[],
) {
  const verifiedPlaces = placeCandidates.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    area: place.area,
    durationMinutes: place.durationMinutes,
  }));

  return `
VERIFIED_PLACE_CANDIDATES_JSON:
${JSON.stringify(verifiedPlaces)}

Use only the IDs from VERIFIED_PLACE_CANDIDATES_JSON for every itinerary item's placeId. Do not invent or add places outside this list.

다음 여행 조건으로 여행 일정을 생성해 주세요.

여행지: ${input.destination}
시작일: ${input.startDate}
종료일: ${input.endDate}
여행 속도: ${input.preference.pace}
예산: ${input.preference.budgetLevel}
관심사: ${input.preference.interests.join(", ")}
동행자: ${input.preference.companions.join(", ") || "미지정"}
추가 요청: ${input.preference.notes || "없음"}

작성 규칙:
- 모든 사용자에게 보이는 문구는 한국어로 작성합니다.
- days는 시작일부터 종료일까지 날짜별로 작성합니다.
- places에는 일정 item에서 참조하는 장소 후보를 포함합니다.
- 각 ItineraryItem의 placeId는 가능한 places의 id와 연결합니다.
- 하루 일정에는 식사와 휴식 흐름이 자연스럽게 포함되어야 합니다.
- 실제 외부 장소 API를 쓰지 않았으므로 장소는 현실적인 후보명으로 작성하되, 좌표는 생략해도 됩니다.
`;
}

export async function modifyTripPlanWithAI(
  message: string,
  tripPlan: TripPlan,
) {
  const { object } = await generateObject({
    model: getTripPlannerModel(),
    schema: modifyTripResponseSchema,
    schemaName: "TripModificationResponse",
    schemaDescription:
      "수정된 TripPlan과 사용자에게 보여줄 짧은 한국어 응답 메시지",
    system: tripModificationPrompt,
    prompt: buildTripModificationUserPrompt(message, tripPlan),
    temperature: 0.3,
  });

  const candidateIds = new Set(tripPlan.places.map((place) => place.id));
  const hasUnknownPlace = object.tripPlan.days.some((day) =>
    day.items.some((item) => item.placeId && !candidateIds.has(item.placeId)),
  );
  if (hasUnknownPlace) {
    throw new Error("AI modification referenced a place outside the verified candidates.");
  }

  return modifyTripResponseSchema.parse({
    ...object,
    tripPlan: {
      ...object.tripPlan,
      id: tripPlan.id,
      input: tripPlan.input,
      places: tripPlan.places,
      chatMessages: tripPlan.chatMessages,
      updatedAt: new Date().toISOString(),
    },
  });
}

function buildTripModificationUserPrompt(message: string, tripPlan: TripPlan) {
  const verifiedPlaces = tripPlan.places.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    area: place.area,
  }));

  return `
VERIFIED_PLACE_CANDIDATES_JSON:
${JSON.stringify(verifiedPlaces)}

Only use the listed IDs for every modified itinerary item's placeId. Keep the places array unchanged and do not invent new places.

사용자 수정 요청:
${message}

기존 TripPlan JSON:
${JSON.stringify(tripPlan, null, 2)}

수정 규칙:
- 사용자의 요청을 실제 days/items/places 데이터 변경으로 반영합니다.
- 전체 일정을 다시 만드는 대신 기존 일정의 흐름과 id를 최대한 유지합니다.
- assistantMessage는 1문장으로, 어떤 방향으로 수정했는지 한국어로 짧게 작성합니다.
- 응답은 modifyTripResponseSchema에 맞는 객체여야 합니다.
`;
}
