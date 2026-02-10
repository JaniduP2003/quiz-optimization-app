import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Validate body
    const body = await request.json();
    const parsed = optimizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json<ApiError>(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Build query with optional filters
    let query = supabase.from("questions").select("*").eq("quiz_id", quizId);

    if (parsed.data.filters?.difficulty) {
      query = query.eq("difficulty", parsed.data.filters.difficulty);
    }
    if (parsed.data.filters?.category) {
      query = query.eq("category", parsed.data.filters.category);
    }

    const { data: questions, error } = query;

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
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
