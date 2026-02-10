import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QuizDetail } from "@/components/quiz-detail";
import type { Quiz, Question } from "@/lib/types";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const supabase = await createSupabaseServerClient();

  // Auth check — redirect to login if not authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (!quiz) {
    redirect("/quizzes");
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: true });

  return (
    <QuizDetail
      quiz={quiz as Quiz}
      questions={(questions as Question[]) ?? []}
    />
  );
}
