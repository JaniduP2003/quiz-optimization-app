import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  handleApiError,
  requireAuth,
  requireQuiz,
  validateBody,
  isErrorResponse,
} from "@/lib/api-utils";
import { optimizeSchema } from "@/lib/validations";
import { optimizeQuestions } from "@/lib/optimizeQuestions";
import type { Question, ApiError, OptimizeResult } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createSupabaseServerClient();

    const user = await requireAuth(supabase);
    if (isErrorResponse(user)) return user;

    const parsed = await validateBody(optimizeSchema, request);
    if (isErrorResponse(parsed)) return parsed;

    const quiz = await requireQuiz(supabase, quizId);
    if (isErrorResponse(quiz)) return quiz;

    // Build query with optional filters
    let query = supabase.from("questions").select("*").eq("quiz_id", quizId);

    if (parsed.filters?.difficulty) {
      query = query.eq("difficulty", parsed.filters.difficulty);
    }
    if (parsed.filters?.category) {
      query = query.eq("category", parsed.filters.category);
    }

    const { data: questions, error } = await query;

    if (error) {
      return NextResponse.json<ApiError>(
        { error: "Failed to fetch questions", details: error.message },
        { status: 500 }
      );
    }

    // Run DP knapsack optimization
    const result = optimizeQuestions(
      questions as Question[],
      parsed.totalTimeLimit
    );

    return NextResponse.json<OptimizeResult>(result);
  } catch (err) {
    return handleApiError(err);
  }
}
