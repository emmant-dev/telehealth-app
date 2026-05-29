import { z } from "zod";

export const updatePatientProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    birthday: z.coerce.date().optional(),
    weightKg: z.number().nonnegative().optional(),
    heightCm: z.number().nonnegative().optional(),
    profilePictureUrl: z.string().url().optional(),
    contactNumber: z.string().max(50).optional(),
    address: z.string().max(300).optional(),
    basicMedicalHistory: z.string().max(5000).optional()
  })
});
