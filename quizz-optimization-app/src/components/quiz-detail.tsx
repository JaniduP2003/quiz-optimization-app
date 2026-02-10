"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { Quiz, Question, OptimizeResult } from "@/lib/types";

interface QuizDetailProps {
  quiz: Quiz;
  questions: Question[];
}

export function QuizDetail({ quiz, questions }: QuizDetailProps) {
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const categories = [
    ...new Set(questions.map((q) => q.category).filter(Boolean)),
  ];
  const optimizedIds = new Set(optimizeResult?.selectedQuestionIds ?? []);

  const handleOptimize = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = { totalTimeLimit: timeLimit };
      const filters: Record<string, string> = {};
      if (filterDifficulty) filters.difficulty = filterDifficulty;
      if (filterCategory) filters.category = filterCategory;
      if (Object.keys(filters).length > 0) body.filters = filters;

      const res = await fetch(`/api/quizzes/${quiz.id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to optimize");
      }

      const result: OptimizeResult = await res.json();
      setOptimizeResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // 1. Create attempt
      const attemptRes = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalTimeLimit: timeLimit }),
      });

      if (!attemptRes.ok) {
        const data = await attemptRes.json();
        throw new Error(data.error || "Failed to create attempt");
      }

      const { attemptId } = await attemptRes.json();

      // 2. Submit answers
      const answerPayload = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          answerText: answers[q.id] || null,
        }));

      if (answerPayload.length === 0) {
        throw new Error("Please answer at least one question");
      }

      const answersRes = await fetch(
        `/api/attempts/${attemptId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answerPayload }),
        }
      );

      if (!answersRes.ok) {
        const data = await answersRes.json();
        throw new Error(data.error || "Failed to submit answers");
      }

      setSuccess("Answers submitted successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-1">{quiz.description}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Settings</CardTitle>
          <CardDescription>
            Set your time budget and optional filters, then optimize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Filter</Label>
              <select
                id="difficulty"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category Filter</Label>
              <select
                id="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c!}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOptimize} disabled={loading}>
              {loading ? "Optimizing..." : "Recommend Optimal Questions"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSubmitAnswers}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Answers"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Result Summary */}
      {optimizeResult && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Optimization Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-medium">Selected:</span>{" "}
                {optimizeResult.selectedQuestions.length} /{" "}
                {questions.length} questions
              </div>
              <div>
                <span className="font-medium">Total Score:</span>{" "}
                {optimizeResult.totalScore}
              </div>
              <div>
                <span className="font-medium">Time Used:</span>{" "}
                {optimizeResult.totalTimeUsed} / {timeLimit} min
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Questions ({questions.length})
        </h2>
        {questions.map((q, idx) => {
          const isOptimized = optimizedIds.has(q.id);
          return (
            <Card
              key={q.id}
              className={
                isOptimized
                  ? "border-2 border-primary bg-primary/5"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Q{idx + 1}. {q.question_text}
                  </CardTitle>
                  {isOptimized && (
                    <Badge variant="default">Recommended</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">Score: {q.score}</Badge>
                  <Badge variant="outline">Time: {q.time_required} min</Badge>
                  <Badge className={difficultyColor(q.difficulty)}>
                    {q.difficulty}
                  </Badge>
                  {q.category && (
                    <Badge variant="secondary">{q.category}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Label htmlFor={`answer-${q.id}`}>Your Answer</Label>
                <Textarea
                  id={`answer-${q.id}`}
                  placeholder="Type your answer here..."
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  className="mt-1"
                  rows={2}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
