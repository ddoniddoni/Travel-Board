import { NextResponse } from "next/server";
import { generateTripPlanWithAI } from "@/features/trip-planner/ai";
import { createMockTripPlan } from "@/features/trip-planner/mock-data";
import {
  generateTripResponseSchema,
  tripInputSchema,
} from "@/features/trip-planner/schemas";
import type { TripInput, TripPlan } from "@/features/trip-planner/types";
import { hasOpenAIKey } from "@/lib/ai/model";

type GenerationSource = "ai" | "mock" | "mock-fallback";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const input = tripInputSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TRIP_INPUT",
          message: "여행 조건을 다시 확인해 주세요.",
        },
      },
      { status: 400 },
    );
  }

  const result = await createTripPlan(input.data);
  const response = generateTripResponseSchema.parse(result);

  return NextResponse.json(response);
}

async function createTripPlan(
  input: TripInput,
): Promise<{ tripPlan: TripPlan; source: GenerationSource }> {
  if (!hasOpenAIKey()) {
    return {
      tripPlan: createMockTripPlan(input),
      source: "mock",
    };
  }

  try {
    return {
      tripPlan: await generateTripPlanWithAI(input),
      source: "ai",
    };
  } catch (error) {
    console.error("AI 일정 생성 실패:", error);
    return {
      tripPlan: createMockTripPlan(input),
      source: "mock-fallback",
    };
  }
}
