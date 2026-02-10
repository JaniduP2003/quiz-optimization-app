import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  handleApiError,
  requireAuth,
  requireQuiz,
  isErrorResponse,
} from "@/lib/api-utils";
import { createAttemptSchema } from "@/lib/validations";
import type { ApiError } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createSupabaseServerClient();

    const user = await requireAuth(supabase);
    if (isErrorResponse(user)) return user;

    // Validate body
    const body = await request.json();
    const parsed = createAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quiz = await requireQuiz(supabase, quizId);
    if (isErrorResponse(quiz)) return quiz;

    // Create attempt
    const { data, error } = await supabase
      .from("attempts")
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        total_time_limit: parsed.data.totalTimeLimit,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json<ApiError>(
        { error: "Failed to create attempt", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ attemptId: data.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
