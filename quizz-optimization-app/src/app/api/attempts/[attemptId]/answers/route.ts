import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, requireAuth, validateBody, isErrorResponse } from "@/lib/api-utils";
import { submitAnswersSchema } from "@/lib/validations";
import type { ApiError } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const supabase = await createSupabaseServerClient();

    const user = await requireAuth(supabase);
    if (isErrorResponse(user)) return user;

    const parsed = await validateBody(submitAnswersSchema, request);
    if (isErrorResponse(parsed)) return parsed;

    // Verify attempt exists and belongs to user
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .select("id, user_id")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json<ApiError>(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.user_id !== user.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Upsert answers (on conflict of attempt_id + question_id, update answer_text)
    const rows = parsed.answers.map((a) => ({
      attempt_id: attemptId,
      question_id: a.questionId,
      answer_text: a.answerText,
    }));

    const { error } = await supabase.from("answers").upsert(rows, {
      onConflict: "attempt_id,question_id",
    });

    if (error) {
      return NextResponse.json<ApiError>(
        { error: "Failed to submit answers", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
