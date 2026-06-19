import { NextResponse } from "next/server";
import { modifyTripPlanWithAI } from "@/features/trip-planner/ai";
import { modifyMockTripPlan } from "@/features/trip-planner/mock-data";
import {
  modifyTripResponseSchema,
  tripModificationRequestSchema,
} from "@/features/trip-planner/schemas";
import type {
  TripModificationRequest,
  TripPlan,
} from "@/features/trip-planner/types";
import { hasOpenAIKey } from "@/lib/ai/model";

type ModificationSource = "ai" | "mock" | "mock-fallback";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = tripModificationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MODIFICATION_REQUEST",
          message: "수정 요청을 처리할 수 없습니다.",
        },
      },
      { status: 400 },
    );
  }

  const response = await modifyTripPlan(parsed.data);

  return NextResponse.json(modifyTripResponseSchema.parse(response));
}

async function modifyTripPlan(
  request: TripModificationRequest,
): Promise<{
  tripPlan: TripPlan;
  assistantMessage: string;
  source: ModificationSource;
}> {
  if (!hasOpenAIKey()) {
    return {
      tripPlan: modifyMockTripPlan(request.message, request.tripPlan),
      assistantMessage: "요청을 반영해 mock 일정 보드를 업데이트했습니다.",
      source: "mock",
    };
  }

  try {
    return {
      ...(await modifyTripPlanWithAI(request.message, request.tripPlan)),
      source: "ai",
    };
  } catch (error) {
    console.error("AI 일정 수정 실패:", error);
    return {
      tripPlan: modifyMockTripPlan(request.message, request.tripPlan),
      assistantMessage:
        "AI 수정에 실패해 mock 방식으로 일정 보드를 업데이트했습니다.",
      source: "mock-fallback",
    };
  }
}
