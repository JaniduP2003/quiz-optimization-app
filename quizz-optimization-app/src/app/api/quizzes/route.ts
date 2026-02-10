import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api-utils";
import type { Quiz, ApiError } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json<ApiError>(
        { error: "Failed to fetch quizzes", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<Quiz[]>(data);
  } catch (err) {
    return handleApiError(err);
  }
}
