import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "../types/auth";

interface TokenPayload {
  id: string;
  role: UserRole;
}

export const signToken = (payload: TokenPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
