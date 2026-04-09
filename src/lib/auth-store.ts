import { create } from "zustand";
import { authApi } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoading: true,

  login: async (email, password) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem("token", token);
    set({ token, user, isLoading: false });
  },

  register: async (email, password, name) => {
    const { token, user } = await authApi.register({ email, password, name });
    localStorage.setItem("token", token);
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
    window.location.href = "/login";
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { user } = await authApi.me();
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
