import api from "./api";
import type { User } from "@/lib/types";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER";
}

export interface AuthPayload {
  token: string;
  user: User;
}

const authService = {
  login: (data: LoginData) =>
    api.post<{ success: boolean; data: AuthPayload }>("/auth/login", data).then((r) => r.data.data),

  register: (data: RegisterData) =>
    api.post<{ success: boolean; data: AuthPayload }>("/auth/register", data).then((r) => r.data.data),

  getMe: () => api.get<{ success: boolean; data: User }>("/auth/me").then((r) => r.data.data),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ success: boolean; message: string }>("/auth/change-password", data).then((r) => r.data),
};

export default authService;
