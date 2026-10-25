import api from "./api";
import type { SummaryItem } from "@/lib/types";

const summaryService = {
  getAll: (subjectId?: string) =>
    api
      .get<{ data: SummaryItem[] }>("/summaries", { params: subjectId ? { subjectId } : {} })
      .then((r) => r.data.data),
  getRecent: () => api.get<{ data: SummaryItem[] }>("/summaries/recent").then((r) => r.data.data),
  getById: (id: string) => api.get<{ data: SummaryItem }>(`/summaries/${id}`).then((r) => r.data.data),
  generate: (d: { documentId: string; language: "th" | "en"; detailLevel: "brief" | "standard" | "detailed" }) =>
    api.post<{ data: SummaryItem }>("/summaries/generate", d, { timeout: 180000 }).then((r) => r.data.data),
  update: (id: string, d: { title?: string; content?: string }) =>
    api.put<{ data: SummaryItem }>(`/summaries/${id}`, d).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/summaries/${id}`),
};

export default summaryService;
