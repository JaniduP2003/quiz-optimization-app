import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api-utils";
import { createAttemptSchema } from "@/lib/validations";
import type { ApiError } from "@/lib/types";

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
    const parsed = createAttemptSchema.safeParse(body);
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
