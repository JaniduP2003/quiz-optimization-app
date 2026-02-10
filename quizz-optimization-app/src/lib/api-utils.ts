import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/types";

/**
 * Boundary error handler for API routes.
 * Logs the actual error for debugging, returns a safe generic response.
 */
export function handleApiError(err: unknown): NextResponse<ApiError> {
  console.error("[API Error]", err instanceof Error ? err.stack : err);
  return NextResponse.json<ApiError>(
    { error: "Internal server error" },
    { status: 500 }
  );
}
