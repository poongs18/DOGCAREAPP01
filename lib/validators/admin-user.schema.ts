import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["DOCTOR", "RECEPTIONIST"]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
