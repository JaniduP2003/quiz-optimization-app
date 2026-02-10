import type { Question, OptimizeResult } from "./types";

/**
 * 0/1 Knapsack with reconstruction.
 *
 * Maps the quiz optimization problem to knapsack:
 *   - Items = questions
 *   - Weight = time_required
 *   - Value = score
 *   - Capacity = totalTimeLimit
 *
 * Complexity: O(n * T) time, O(n * T) space
 *   where n = number of questions, T = totalTimeLimit
 */
export function optimizeQuestions(
  questions: Question[],
  totalTimeLimit: number
): OptimizeResult {
  const n = questions.length;
  const T = totalTimeLimit;

  // Edge cases
  if (n === 0 || T <= 0) {
    return {
      selectedQuestionIds: [],
      selectedQuestions: [],
      totalScore: 0,
      totalTimeUsed: 0,
    };
  }

  // dp[i][t] = max score using first i items with capacity t
  // keep[i][t] = whether item i was included in dp[i][t]
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(T + 1).fill(0)
  );
  const keep: boolean[][] = Array.from({ length: n + 1 }, () =>
    new Array(T + 1).fill(false)
  );

  for (let i = 1; i <= n; i++) {
    const question = questions[i - 1];
    const w = question.time_required;
    const v = question.score;

    for (let t = 0; t <= T; t++) {
      // Don't take item i
      dp[i][t] = dp[i - 1][t];

      // Take item i (if it fits and improves score)
      if (w <= t && dp[i - 1][t - w] + v > dp[i][t]) {
        dp[i][t] = dp[i - 1][t - w] + v;
        keep[i][t] = true;
      }
    }
  }

  // Reconstruction: trace back to find which items were selected
  const selectedQuestions: Question[] = [];
  let remainingCapacity = T;

  for (let i = n; i >= 1; i--) {
    if (keep[i][remainingCapacity]) {
      selectedQuestions.push(questions[i - 1]);
      remainingCapacity -= questions[i - 1].time_required;
    }
  }

  // Reverse so they appear in original order
  selectedQuestions.reverse();

  const totalScore = selectedQuestions.reduce((sum, q) => sum + q.score, 0);
  const totalTimeUsed = selectedQuestions.reduce(
    (sum, q) => sum + q.time_required,
    0
  );

  return {
    selectedQuestionIds: selectedQuestions.map((q) => q.id),
    selectedQuestions,
    totalScore,
    totalTimeUsed,
  };
}
