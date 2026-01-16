import { z } from "zod";

const groomingDetailsSchema = z.object({
  groomingStyle: z.string().optional(),
  coatCondition: z.string().optional(),
  specialRequests: z.string().optional(),
});

const trainingDetailsSchema = z.object({
  trainingLevel: z.string().optional(),
  behaviorNotes: z.string().optional(),
  goals: z.string().optional(),
});

const vetDetailsSchema = z.object({
  symptoms: z.string().optional(),
  previousIssues: z.string().optional(),
  medications: z.string().optional(),
});

export const bookingSchema = z.object({
  petId: z.string().min(1),
  serviceVariantId: z.string().min(1),

  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/),

  transportOption: z.enum(["NONE", "PICKUP", "DROP", "BOTH"]).optional(),
  notes: z.string().optional(),

  details: z
    .union([groomingDetailsSchema, trainingDetailsSchema, vetDetailsSchema])
    .optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
