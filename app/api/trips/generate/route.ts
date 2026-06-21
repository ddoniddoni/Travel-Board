import { NextResponse } from "next/server";
import { addItineraryQualityNotes } from "@/features/trip-planner/itinerary-quality";
import { createMockTripPlan } from "@/features/trip-planner/mock-data";
import {
  generateTripResponseSchema,
  tripInputSchema,
} from "@/features/trip-planner/schemas";
import type { PlaceCandidate, TripInput, TripPlan } from "@/features/trip-planner/types";
import { apiErrorResponse } from "@/lib/server/api-response";
import { mockPlacesTool, searchPlaces } from "@/lib/server/places";

type GenerationSource = "mock";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse("INVALID_JSON", "요청 내용을 읽지 못했습니다. 다시 시도해 주세요.", 400);
  }

  const input = tripInputSchema.safeParse(body);
  if (!input.success) {
    return apiErrorResponse("INVALID_TRIP_INPUT", "여행 조건을 다시 확인해 주세요.", 400);
  }

  try {
    const generated = await createTripPlan(input.data);
    const result = {
      ...generated,
      tripPlan: addItineraryQualityNotes(generated.tripPlan),
    };
    const response = generateTripResponseSchema.safeParse(result);

    if (!response.success) {
      console.error("Trip generation response validation failed", response.error);
      return apiErrorResponse("TRIP_GENERATION_FAILED", "일정을 만드는 중 문제가 생겼습니다. 다시 시도해 주세요.", 500);
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Trip generation request failed", error);
    return apiErrorResponse("TRIP_GENERATION_FAILED", "일정을 만드는 중 문제가 생겼습니다. 다시 시도해 주세요.", 500);
  }
}

async function createTripPlan(
  input: TripInput,
): Promise<{ tripPlan: TripPlan; source: GenerationSource }> {
  let placeCandidates: PlaceCandidate[];
  try {
    placeCandidates = await searchPlaces(input);
  } catch (error) {
    console.error("Place search failed; falling back to mock places", error);
    placeCandidates = await mockPlacesTool.searchPlaces(input);
  }

  return {
    tripPlan: createMockTripPlan(input, placeCandidates),
    source: "mock",
  };
}
