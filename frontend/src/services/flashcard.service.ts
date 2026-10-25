import api from "./api";
import type { Flashcard } from "@/lib/types";

const flashcardService = {
  getAll: (summaryId?: string) =>
    api
      .get<{ data: Flashcard[] }>("/flashcards", { params: summaryId ? { summaryId } : {} })
      .then((r) => r.data.data),
  generate: (summaryId: string, count = 10) =>
    api.post<{ data: Flashcard[] }>("/flashcards/generate", { summaryId, count }, { timeout: 180000 }).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/flashcards/${id}`),
};

export default flashcardService;
