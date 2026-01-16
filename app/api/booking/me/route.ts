import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = verifyAccessToken(req);
    const userId = auth.sub;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
          },
        },
        groomingDetails: true,
        trainingDetails: true,
        vetDetails: true,
      },
    });

    const response = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      bookingDate: b.bookingDate,
      bookingTime: b.bookingTime,
      totalAmount: b.totalAmount,
      transportOption: b.transportOption,

      pet: b.pet,

      service: {
        id: b.variant.service.id,
        name: b.variant.service.name,
        type: b.variant.service.type,
      },

      variant: {
        id: b.variant.id,
        name: b.variant.name,
        price: b.variant.price,
        durationMin: b.variant.durationMin,
      },

      details:
        b.groomingDetails ??
        b.trainingDetails ??
        b.vetDetails ??
        null,

      createdAt: b.createdAt,
    }));

    /* -----------------------------
       6. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      {
        message: "Bookings fetched successfully",
        bookings: response,
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

    console.error("Get bookings error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
