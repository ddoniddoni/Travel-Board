import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Trip generation will be implemented in the next phase.",
      },
    },
    { status: 501 },
  );
}
