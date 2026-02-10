import { z } from "zod";

export const createAttemptSchema = z.object({
  totalTimeLimit: z.number().int().positive("totalTimeLimit must be > 0"),
});

export const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid("questionId must be a valid UUID"),
        answerText: z.string().nullable(),
      })
    )
    .min(1, "At least one answer is required"),
});

export const optimizeSchema = z.object({
  totalTimeLimit: z.number().int().positive("totalTimeLimit must be > 0"),
  filters: z
    .object({
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      category: z.string().optional(),
    })
    .optional(),
});
