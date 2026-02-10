export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  score: number;
  time_required: number;
  difficulty: "easy" | "medium" | "hard";
  category: string | null;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  total_time_limit: number;
  created_at: string;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface OptimizeResult {
  selectedQuestionIds: string[];
  selectedQuestions: Question[];
  totalScore: number;
  totalTimeUsed: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
