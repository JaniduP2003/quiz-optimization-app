import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/types";

export default async function QuizzesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quizzes</h1>
      <p className="text-muted-foreground">
        Select a quiz to view questions and optimize your selection.
      </p>

      {!quizzes || quizzes.length === 0 ? (
        <p className="text-muted-foreground">No quizzes available.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(quizzes as Quiz[]).map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/quizzes/${quiz.id}`}>View Quiz</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
