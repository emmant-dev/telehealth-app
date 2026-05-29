import { apiClient } from "./client";
import type {
  ApiEnvelope,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload
} from "../types";

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<ApiEnvelope<AuthResponse>>("/api/auth/register", payload);
    return response.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<ApiEnvelope<AuthResponse>>("/api/auth/login", payload);
    return response.data.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>("/api/auth/me");
    return response.data.data.user;
  }
};
