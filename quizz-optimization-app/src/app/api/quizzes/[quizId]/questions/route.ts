import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, requireQuiz, isErrorResponse } from "@/lib/api-utils";
import type { Question, ApiError } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createSupabaseServerClient();

    const quiz = await requireQuiz(supabase, quizId);
    if (isErrorResponse(quiz)) return quiz;

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json<ApiError>(
        { error: "Failed to fetch questions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<Question[]>(data);
  } catch (err) {
    return handleApiError(err);
  }
}
