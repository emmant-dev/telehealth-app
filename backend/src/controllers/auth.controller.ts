import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = await registerUser(req.body);
  res.status(201).json({ success: true, data: result });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = await loginUser(req.body);
  res.status(200).json({ success: true, data: result });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, data: { user: req.user } });
};
