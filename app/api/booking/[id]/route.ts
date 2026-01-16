import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

/* ================================
   GET /api/booking/[id]
================================ */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAccessToken(req);
    const userId = auth.sub;

    const { id: bookingId } = await context.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId, // 🔒 ownership check
      },
      include: {
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
            service: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            breed: true,
            gender: true,
            age: true,
            weightKg: true,
          },
        },
        groomingDetails: true,
        trainingDetails: true,
        vetDetails: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    const response = {
      id: booking.id,
      status: booking.status,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      totalAmount: booking.totalAmount,
      transportOption: booking.transportOption,
      notes: booking.notes,

      pet: booking.pet,

      service: {
        id: booking.variant.service.id,
        name: booking.variant.service.name,
        type: booking.variant.service.type,
      },

      variant: {
        id: booking.variant.id,
        name: booking.variant.name,
        price: booking.variant.price,
        durationMin: booking.variant.durationMin,
      },

      details:
        booking.groomingDetails ??
        booking.trainingDetails ??
        booking.vetDetails ??
        null,

      createdAt: booking.createdAt,
    };

    return NextResponse.json(
      {
        message: "Booking fetched successfully",
        booking: response,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (
      err.message === "TOKEN_MISSING" ||
      err.message === "TOKEN_INVALID"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { message: "Token expired" },
        { status: 401 }
      );
    }

    console.error("Get booking by id error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ================================
   DELETE /api/booking/[id]
================================ */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAccessToken(req);
    const userId = auth.sub;

    const { id: bookingId } = await context.params;

    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking ID missing" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { message: "Booking already cancelled" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json(
      {
        message: "Booking cancelled successfully",
        bookingId: updated.id,
        status: updated.status,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (
      err.message === "TOKEN_MISSING" ||
      err.message === "TOKEN_INVALID"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { message: "Token expired" },
        { status: 401 }
      );
    }

    console.error("Cancel booking error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
