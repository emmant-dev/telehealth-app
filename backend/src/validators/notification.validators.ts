import { z } from "zod";

export const markNotificationReadSchema = z.object({
  body: z.object({
    read: z.boolean()
  })
});
