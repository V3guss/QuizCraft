import api from "./api";
import type { QuizQuestion, QuizSubmitResult } from "@/lib/types";

const quizService = {
  getQuestions: (summaryId?: string) =>
    api
      .get<{ data: QuizQuestion[] }>("/quiz/questions", { params: summaryId ? { summaryId } : {} })
      .then((r) => r.data.data),
  generate: (summaryId: string, count = 10) =>
    api.post<{ data: QuizQuestion[] }>("/quiz/generate", { summaryId, count }, { timeout: 180000 }).then((r) => r.data.data),
  submit: (answers: { questionId: string; selectedAnswer: number }[]) =>
    api.post<{ data: QuizSubmitResult }>("/quiz/submit", { answers }).then((r) => r.data.data),
};

export default quizService;
