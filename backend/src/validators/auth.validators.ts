import { z } from "zod";

// Registration password validation runs before account creation so weak credentials
// are rejected before any user record or password hash is persisted.
const registrationPasswordSchema = z
  .string()
  // Longer passwords increase brute-force search space and reduce the risk of easy guessing.
  .min(8, "Password must be at least 8 characters long")
  // Uppercase characters increase password complexity beyond common lowercase-only patterns.
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  // Lowercase characters ensure mixed-case entropy and avoid predictable uppercase-only passwords.
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  // Numbers add another character class, making credential stuffing and guessing harder.
  .regex(/[0-9]/, "Password must include at least one number")
  // Special characters expand the possible password space and discourage dictionary-only passwords.
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: registrationPasswordSchema,
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
