import api from "./api";
import type { DocumentItem } from "@/lib/types";

export interface UploadDocumentData {
  file: File;
  title: string;
  subjectId: string;
  description?: string;
}

const documentService = {
  getAll: (subjectId?: string) =>
    api
      .get<{ data: DocumentItem[] }>("/documents", { params: subjectId ? { subjectId } : {} })
      .then((r) => r.data.data),

  getRecent: () => api.get<{ data: DocumentItem[] }>("/documents/recent").then((r) => r.data.data),

  upload: (d: UploadDocumentData, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", d.file);
    form.append("title", d.title);
    form.append("subjectId", d.subjectId);
    if (d.description) form.append("description", d.description);
    return api
      .post<{ data: DocumentItem }>("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((r) => r.data.data);
  },

  remove: (id: string) => api.delete(`/documents/${id}`),
};

export default documentService;
