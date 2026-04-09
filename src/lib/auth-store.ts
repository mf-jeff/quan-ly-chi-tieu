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

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function storeToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
}

function clearToken() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: getStoredToken(),
  isLoading: true,

  login: async (email, password, rememberMe = true) => {
    const { token, user } = await authApi.login({ email, password });
    storeToken(token, rememberMe);
    set({ token, user, isLoading: false });
  },

  register: async (email, password, name, inviteCode) => {
    const { token, user } = await authApi.register({ email, password, name, inviteCode });
    storeToken(token, true); // Always remember on register
    set({ token, user, isLoading: false });
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null });
    window.location.href = "/login";
  },

  loadUser: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { user } = await authApi.me();
      set({ user, token, isLoading: false });
    } catch {
      clearToken();
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
