import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { bookingSchema, BookingInput } from "@/lib/validators/booking.schema";

export async function POST(req: Request) {
  try {
    // Auth
    const auth = verifyAccessToken(req);
    const userId = auth.sub;

    const body = await req.json();
    const parsed: BookingInput = bookingSchema.parse(body);

    // Validate pet ownership
    const pet = await prisma.pet.findFirst({
      where: { id: parsed.petId, ownerId: userId },
    });

    if (!pet) {
      return NextResponse.json({ message: "Invalid pet" }, { status: 403 });
    }

    // Validate service variant + include service
    const variant = await prisma.serviceVariant.findFirst({
      where: { id: parsed.serviceVariantId, isActive: true },
      include: { service: true },
    });

    if (!variant) {
      return NextResponse.json(
        { message: "Invalid service variant" },
        { status: 404 }
      );
    }

    // Parse time safely
    const [hours, minutes] = parsed.bookingTime.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return NextResponse.json(
        { message: "Invalid bookingTime format. Use HH:mm" },
        { status: 400 }
      );
    }

    // Transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId,
          petId: parsed.petId,
          serviceVariantId: parsed.serviceVariantId,
          bookingDate: new Date(parsed.bookingDate),
          bookingTime: new Date(1970, 0, 1, hours, minutes),
          transportOption: parsed.transportOption ?? "NONE",
          totalAmount: variant.price,
          notes: parsed.notes,
        },
      });

      const serviceName = variant.service.name;
      const serviceType = variant.service.type;
      console.log("Service name:", serviceName);
      console.log("Service type:", serviceType);
      console.log("Details:", parsed.details);


if (serviceName === "Grooming" && parsed.details && "groomingStyle" in parsed.details) {
  await tx.groomingBookingDetails.create({
    data: {
      bookingId: newBooking.id,
      groomingStyle: parsed.details.groomingStyle ?? null,
      coatCondition: parsed.details.coatCondition ?? null,
      specialRequests: parsed.details.specialRequests ?? null,
    },
  });
}

if (serviceName === "Training" && parsed.details && "trainingLevel" in parsed.details) {
  await tx.trainingBookingDetails.create({
    data: {
      bookingId: newBooking.id,
      trainingLevel: parsed.details.trainingLevel ?? null,
      behaviorNotes: parsed.details.behaviorNotes ?? null,
      goals: parsed.details.goals ?? null,
    },
  });
}

if (serviceType === "MEDICAL" && parsed.details && "symptoms" in parsed.details) {
  await tx.vetBookingDetails.create({
    data: {
      bookingId: newBooking.id,
      symptoms: parsed.details.symptoms ?? null,
      previousIssues: parsed.details.previousIssues ?? null,
      medications: parsed.details.medications ?? null,
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
    console.error("Create booking error:", err);

    if (err.message === "TOKEN_MISSING" || err.message === "TOKEN_INVALID") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    return NextResponse.json(
      { message: err.message ?? "Invalid request" },
      { status: 400 }
    );
  }
}
