import { z } from "zod";

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid doctor id"),
    appointmentAt: z.coerce.date(),
    reason: z.string().max(1000).optional()
  })
});

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    appointmentAt: z.coerce.date()
  })
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "confirmed", "cancelled", "completed"])
  })
});
