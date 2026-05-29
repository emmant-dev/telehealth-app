import { NextFunction, Response } from "express";
import { User } from "../models/User";
import { AuthRequest } from "../types/auth";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token is required");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select("_id role");

    if (!user) {
      throw new ApiError(401, "Invalid authentication token");
    }

    req.user = {
      id: user._id.toString(),
      role: user.role
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid authentication token"));
  }
};
