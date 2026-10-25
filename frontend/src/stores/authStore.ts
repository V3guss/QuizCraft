import { create } from "zustand";
import authService, { RegisterData } from "@/services/auth.service";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

function persist(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { token, user } = await authService.login({ email, password });
    persist(token, user);
    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  register: async (data) => {
    const { token, user } = await authService.register(data);
    persist(token, user);
    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
