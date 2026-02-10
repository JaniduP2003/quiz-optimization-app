import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
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

/**
 * Returns the authenticated user or a 401 response.
 * Use at the boundary of protected API routes.
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<User | NextResponse<ApiError>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json<ApiError>(
      { error: "Unauthenticated" },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Verifies a quiz exists or returns a 404 response.
 * Use at the boundary of quiz-scoped API routes.
 */
export async function requireQuiz(
  supabase: SupabaseClient,
  quizId: string
): Promise<{ id: string } | NextResponse<ApiError>> {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .single();

  if (error || !quiz) {
    return NextResponse.json<ApiError>(
      { error: "Quiz not found" },
      { status: 404 }
    );
  }

  return quiz;
}

/** Type guard: true when the helper returned an error response instead of data. */
export function isErrorResponse(
  value: unknown
): value is NextResponse<ApiError> {
  return value instanceof NextResponse;
}
