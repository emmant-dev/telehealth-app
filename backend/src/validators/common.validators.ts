import { z } from "zod";

export const mongoIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")
  })
});

export const optionalPaginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});
