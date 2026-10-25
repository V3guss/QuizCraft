import api from "./api";
import type { Subject } from "@/lib/types";

export interface SubjectInput {
  name: string;
  description?: string;
  color?: string;
}

const subjectService = {
  getAll: () => api.get<{ data: Subject[] }>("/subjects").then((r) => r.data.data),
  create: (d: SubjectInput) => api.post<{ data: Subject }>("/subjects", d).then((r) => r.data.data),
  update: (id: string, d: SubjectInput) =>
    api.put<{ data: Subject }>(`/subjects/${id}`, d).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/subjects/${id}`),
};

export default subjectService;
