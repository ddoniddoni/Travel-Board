import "server-only";

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_TRIP_INPUT"
  | "INVALID_MODIFICATION_REQUEST"
  | "TRIP_GENERATION_FAILED"
  | "TRIP_MODIFICATION_FAILED";

export function apiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}
