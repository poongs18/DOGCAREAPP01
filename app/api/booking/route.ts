import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { bookingSchema, BookingInput } from "@/lib/validators/booking.schema";

export async function POST(req: Request) {
  try {
    // ✅ Use your existing auth helper
    const auth = verifyAccessToken(req);
    const userId = auth.sub;

    const body = await req.json();
    const parsed: BookingInput = bookingSchema.parse(body);

    // 1. Validate pet ownership
    const pet = await prisma.pet.findFirst({
      where: { id: parsed.petId, ownerId: userId },
    });

    if (!pet) {
      return NextResponse.json({ message: "Invalid pet" }, { status: 403 });
    }

    // 2. Validate service variant
    const variant = await prisma.serviceVariant.findFirst({
      where: { id: parsed.serviceVariantId, isActive: true },
    });

    if (!variant) {
      return NextResponse.json(
        { message: "Invalid service variant" },
        { status: 404 }
      );
    }

    // 3. Transaction: booking + details
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId,
          petId: parsed.petId,
          serviceVariantId: parsed.serviceVariantId,
          bookingDate: new Date(parsed.bookingDate),
          bookingTime: new Date(`1970-01-01T${parsed.bookingTime}:00`),
          transportOption: parsed.transportOption ?? "NONE",
          totalAmount: variant.price,
          notes: parsed.notes,
        },
      });

      if (parsed.details.type === "GROOMING") {
        await tx.groomingBookingDetails.create({
          data: {
            bookingId: newBooking.id,
            groomingStyle: parsed.details.groomingStyle,
            coatCondition: parsed.details.coatCondition,
            specialRequests: parsed.details.specialRequests,
          },
        });
      }

      if (parsed.details.type === "TRAINING") {
        await tx.trainingBookingDetails.create({
          data: {
            bookingId: newBooking.id,
            trainingLevel: parsed.details.trainingLevel,
            behaviorNotes: parsed.details.behaviorNotes,
            goals: parsed.details.goals,
          },
        });
      }

      if (parsed.details.type === "VET") {
        await tx.vetBookingDetails.create({
          data: {
            bookingId: newBooking.id,
            symptoms: parsed.details.symptoms,
            previousIssues: parsed.details.previousIssues,
            medications: parsed.details.medications,
          },
        });
      }

      return newBooking;
    });

    return NextResponse.json(
      {
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
        serviceVariant: variant.name,
        bookingDate: parsed.bookingDate,
        bookingTime: parsed.bookingTime,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create booking error:", err.message);
    return NextResponse.json(
      { message: err.message ?? "Invalid request" },
      { status: 400 }
    );
  }
}
