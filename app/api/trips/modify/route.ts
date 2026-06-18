import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Trip modification will be implemented after TripPlan schema.",
      },
    },
    { status: 501 },
  );
}
