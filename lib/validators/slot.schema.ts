import { z } from "zod";

export const createSlotSchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().positive(),
});
