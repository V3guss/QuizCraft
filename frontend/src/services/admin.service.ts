import api from "./api";
import type { Role } from "@/lib/types";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  _count: { documents: number; summaries: number; subjects: number };
}

export interface AdminStats {
  users: number;
  documents: number;
  summaries: number;
  flashcards: number;
  quizAttempts: number;
  subjects: number;
}

const adminService = {
  getUsers: () => api.get<{ data: AdminUser[] }>("/admin/users").then((r) => r.data.data),
  getStats: () => api.get<{ data: AdminStats }>("/admin/stats").then((r) => r.data.data),
  updateUser: (id: string, d: { name?: string; email?: string; role?: Role }) =>
    api.put(`/admin/users/${id}`, d).then((r) => r.data.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

export default adminService;
