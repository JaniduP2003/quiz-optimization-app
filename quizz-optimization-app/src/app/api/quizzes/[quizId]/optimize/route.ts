import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  handleApiError,
  requireAuth,
  requireQuiz,
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

    // Validate body
    const body = await request.json();
    const parsed = optimizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quiz = await requireQuiz(supabase, quizId);
    if (isErrorResponse(quiz)) return quiz;

    // Build query with optional filters
    let query = supabase.from("questions").select("*").eq("quiz_id", quizId);

    if (parsed.data.filters?.difficulty) {
      query = query.eq("difficulty", parsed.data.filters.difficulty);
    }
    if (parsed.data.filters?.category) {
      query = query.eq("category", parsed.data.filters.category);
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
      parsed.data.totalTimeLimit
    );

    return NextResponse.json<OptimizeResult>(result);
  } catch (err) {
    return handleApiError(err);
  }
}
