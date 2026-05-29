import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  body: z.object({
    appointmentId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid appointment id"),
    notes: z.string().min(1).max(10000),
    prescription: z.string().max(10000).optional()
  })
});

export const updateMedicalRecordSchema = z.object({
  body: z.object({
    notes: z.string().min(1).max(10000).optional(),
    prescription: z.string().max(10000).optional()
  })
});
