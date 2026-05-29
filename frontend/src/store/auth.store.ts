import { create } from "zustand";
import { authApi } from "../api/auth.api";
import type { AuthUser, LoginPayload, RegisterPayload, UserRole } from "../types";
import { tokenStorage } from "../utils/token";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: tokenStorage.get(),
  role: null,
  isAuthenticated: false,
  isLoading: true,

  async initialize() {
    const token = tokenStorage.get();

    if (!token) {
      set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await authApi.me();
      set({
        user,
        token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false
      });
    } catch {
      tokenStorage.clear();
      set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
    }
  },

  async login(payload) {
    const { token, user } = await authApi.login(payload);
    tokenStorage.set(token);
    set({ token, user, role: user.role, isAuthenticated: true, isLoading: false });
    return user;
  },

  async register(payload) {
    const { token, user } = await authApi.register(payload);
    tokenStorage.set(token);
    set({ token, user, role: user.role, isAuthenticated: true, isLoading: false });
    return user;
  },

  logout() {
    tokenStorage.clear();
    set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
  }
}));
