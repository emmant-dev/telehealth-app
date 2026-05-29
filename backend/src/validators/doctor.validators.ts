import { z } from "zod";

export const updateDoctorProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    bio: z.string().max(2000).optional(),
    specialization: z.string().min(1).max(120).optional(),
    profilePictureUrl: z.string().url().optional(),
    contactNumber: z.string().max(50).optional(),
    availableSlots: z.array(z.coerce.date()).optional(),
    unavailableSlots: z.array(z.coerce.date()).optional()
  })
});

export const doctorSearchSchema = z.object({
  query: z.object({
    specialization: z.string().max(120).optional(),
    search: z.string().max(120).optional()
  })
});
