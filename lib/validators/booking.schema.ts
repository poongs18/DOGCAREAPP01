import { z } from "zod";

const groomingDetailsSchema = z.object({
  type: z.literal("GROOMING"),
  groomingStyle: z.string().optional(),
  coatCondition: z.string().optional(),
  specialRequests: z.string().optional(),
});

const trainingDetailsSchema = z.object({
  type: z.literal("TRAINING"),
  trainingLevel: z.string().optional(),
  behaviorNotes: z.string().optional(),
  goals: z.string().optional(),
});

const vetDetailsSchema = z.object({
  type: z.literal("VET"),
  symptoms: z.string().optional(),
  previousIssues: z.string().optional(),
  medications: z.string().optional(),
});

export const bookingSchema = z.object({
  petId: z.string().min(1),
  serviceVariantId: z.string().min(1),
  bookingDate: z.string(),
  bookingTime: z.string(),
  transportOption: z.enum(["NONE", "PICKUP", "DROP", "BOTH"]).optional(),
  notes: z.string().optional(),

  details: z.discriminatedUnion("type", [
    groomingDetailsSchema,
    trainingDetailsSchema,
    vetDetailsSchema,
  ]),
});

export type BookingInput = z.infer<typeof bookingSchema>;
