import { z } from "zod";

export const createBookingSchema = z.object({
  petId: z.string().cuid(),
  serviceId: z.string().cuid(),
  slotId: z.string().cuid(),

  bookingDate: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),

  pickupOption: z.enum([
    "NONE",
    "PICKUP_ONLY",
    "DROP_ONLY",
    "PICKUP_AND_DROP",
  ]),

  notes: z.string().max(500).optional(),
});
