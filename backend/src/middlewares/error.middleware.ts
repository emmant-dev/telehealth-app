import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Internal server error";
  const details = error instanceof ApiError ? error.details : undefined;

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.nodeEnv === "development" && !(error instanceof ApiError) ? { stack: error.stack } : {})
  });
};
