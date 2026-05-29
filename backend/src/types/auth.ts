import { Request } from "express";

export type UserRole = "patient" | "doctor";

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
