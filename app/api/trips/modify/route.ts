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
import { apiErrorResponse } from "@/lib/server/api-response";

type ModificationSource = "ai" | "mock" | "mock-fallback";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse(
      "INVALID_JSON",
      "요청 내용을 읽지 못했습니다. 다시 시도해 주세요.",
      400,
    );
  }
  const parsed = tripModificationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiErrorResponse(
      "INVALID_MODIFICATION_REQUEST",
      "수정 요청을 처리할 수 없습니다.",
      400,
    );
  }

  try {
    const result = await modifyTripPlan(parsed.data);
    const response = modifyTripResponseSchema.safeParse(result);

    if (!response.success) {
      console.error("Trip modification response validation failed", response.error);
      return apiErrorResponse(
        "TRIP_MODIFICATION_FAILED",
        "수정 요청을 반영하는 중 문제가 생겼습니다. 다시 시도해 주세요.",
        500,
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Trip modification request failed", error);
    return apiErrorResponse(
      "TRIP_MODIFICATION_FAILED",
      "수정 요청을 반영하는 중 문제가 생겼습니다. 다시 시도해 주세요.",
      500,
    );
  }
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
