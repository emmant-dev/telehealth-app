import { NextFunction, Response } from "express";
import { AuthRequest, UserRole } from "../types/auth";
import { ApiError } from "../utils/ApiError";

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Authentication is required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
