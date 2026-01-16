import { z } from "zod";

export const createPetSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  breed: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  age: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updatePetSchema = createPetSchema.partial();