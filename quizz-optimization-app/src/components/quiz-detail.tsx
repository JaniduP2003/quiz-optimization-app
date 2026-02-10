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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Trophy,
  Clock,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import type { Quiz, Question, OptimizeResult } from "@/lib/types";

interface QuizDetailProps {
  quiz: Quiz;
  questions: Question[];
}

function QuestionCard({
  question,
  index,
  isOptimized,
  answer,
  onAnswerChange,
  difficultyColor,
}: {
  question: Question;
  index: number;
  isOptimized: boolean;
  answer: string;
  onAnswerChange: (value: string) => void;
  difficultyColor: (d: string) => string;
}) {
  return (
    <Card
      className={
        isOptimized
          ? "border-l-4 border-l-primary border-primary/40 bg-primary/5"
          : "border-l-4 border-l-transparent"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </span>
            <CardTitle className="text-base leading-relaxed">
              {question.question_text}
            </CardTitle>
          </div>
          {isOptimized && (
            <Badge variant="default" className="shrink-0 gap-1">
              <CheckCircle className="size-3" />
              Recommended
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 ml-10">
          <Badge variant="outline" className="text-xs">
            {question.score} pts
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="size-3 mr-0.5" />
            {question.time_required} min
          </Badge>
          <Badge className={difficultyColor(question.difficulty)}>
            {question.difficulty}
          </Badge>
          {question.category && (
            <Badge variant="secondary">{question.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-[3.75rem]">
        <Textarea
          id={`answer-${question.id}`}
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          rows={2}
        />
      </CardContent>
    </Card>
  );
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

  // O(n) index map — avoids O(n) indexOf inside render loops
  const questionIndexMap = new Map(questions.map((q, idx) => [q.id, idx]));

  const recommendedQuestions = questions.filter((q) => optimizedIds.has(q.id));
  const otherQuestions = questions.filter((q) => !optimizedIds.has(q.id));

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

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const timeUsedPercent = optimizeResult
    ? Math.round((optimizeResult.totalTimeUsed / timeLimit) * 100)
    : 0;

  const maxPossibleScore = questions.reduce((sum, q) => sum + q.score, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-1">{quiz.description}</p>
        )}
      </div>

      {/* Alerts */}
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

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Optimization Settings
          </CardTitle>
          <CardDescription>
            Set your time budget and optional filters, then optimize to get the
            best question selection.
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
              <Label>Difficulty</Label>
              <Select
                value={filterDifficulty}
                onValueChange={(val) =>
                  setFilterDifficulty(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filterCategory}
                onValueChange={(val) =>
                  setFilterCategory(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c!}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOptimize} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Recommend Optimal Questions
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSubmitAnswers}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit Answers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Result Summary */}
      {optimizeResult && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              Optimization Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-background p-4 text-center shadow-sm border">
                <div className="text-2xl font-bold text-primary">
                  {optimizeResult.selectedQuestions.length}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / {questions.length}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Questions Selected
                </div>
              </div>
              <div className="rounded-lg bg-background p-4 text-center shadow-sm border">
                <div className="text-2xl font-bold text-primary">
                  {optimizeResult.totalScore}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / {maxPossibleScore}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Score
                </div>
              </div>
              <div className="rounded-lg bg-background p-4 text-center shadow-sm border">
                <div className="text-2xl font-bold text-primary">
                  {optimizeResult.totalTimeUsed}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / {timeLimit} min
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Time Budget Used
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time utilization</span>
                <span className="font-medium">{timeUsedPercent}%</span>
              </div>
              <Progress value={timeUsedPercent} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time utilization</span>
                <span className="font-medium">{timeUsedPercent}%</span>
              </div>
              <Progress value={timeUsedPercent} />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Questions Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Questions ({questions.length})
        </h2>

        {optimizeResult ? (
          <Tabs defaultValue="recommended">
            <TabsList>
              <TabsTrigger value="recommended">
                Recommended ({recommendedQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Questions ({questions.length})
              </TabsTrigger>
              {otherQuestions.length > 0 && (
                <TabsTrigger value="skipped">
                  Skipped ({otherQuestions.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="recommended" className="space-y-3 mt-4">
              {recommendedQuestions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No questions were recommended for the given constraints.
                </p>
              ) : (
                recommendedQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questionIndexMap.get(q.id) ?? 0}
                    isOptimized={true}
                    answer={answers[q.id] ?? ""}
                    onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                    difficultyColor={difficultyColor}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 mt-4">
              {questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  isOptimized={optimizedIds.has(q.id)}
                  answer={answers[q.id] ?? ""}
                  onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                  difficultyColor={difficultyColor}
                />
              ))}
            </TabsContent>

            {otherQuestions.length > 0 && (
              <TabsContent value="skipped" className="space-y-3 mt-4">
                {otherQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questionIndexMap.get(q.id) ?? 0}
                    isOptimized={false}
                    answer={answers[q.id] ?? ""}
                    onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                    difficultyColor={difficultyColor}
                  />
                ))}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                isOptimized={false}
                answer={answers[q.id] ?? ""}
                onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                difficultyColor={difficultyColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
