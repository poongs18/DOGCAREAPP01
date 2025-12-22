import { z } from "zod";

export const updateServiceSchema = z.object({
  price: z.number().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
