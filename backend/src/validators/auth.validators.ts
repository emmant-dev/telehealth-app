import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["patient", "doctor"]),
    name: z.string().min(1).max(120),
    specialization: z.string().min(1).max(120).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});
