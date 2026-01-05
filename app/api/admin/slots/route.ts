import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { createSlotSchema } from "@/lib/validators/slot.schema";
import { Role, SlotStatus, ServiceType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    /* --------------------------------
       1. AUTH
    -------------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    /* --------------------------------
       2. VALIDATION
    -------------------------------- */
    const body = await req.json();
    const parsed = createSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, staffId, startTime, endTime, capacity } = parsed.data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { message: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    /* --------------------------------
       3. FETCH SERVICE
    -------------------------------- */
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        type: true,
        status: true,
      },
    });

    if (!service || service.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "Service not found or inactive" },
        { status: 404 }
      );
    }

    /* --------------------------------
       4. BUSINESS RULES
    -------------------------------- */
    // MEDICAL services MUST have staff
    if (service.type === ServiceType.MEDICAL && !staffId) {
      return NextResponse.json(
        { message: "Medical services require a doctor" },
        { status: 400 }
      );
    }

    // Validate staff if provided
    if (staffId) {
      const staff = await prisma.user.findUnique({
        where: { id: staffId },
        select: { role: true, status: true },
      });

      if (
  !staff ||
  staff.status !== "ACTIVE" ||
  (staff.role !== Role.DOCTOR && staff.role !== Role.RECEPTIONIST)
) {
  return NextResponse.json(
    { message: "Invalid staff assignment" },
    { status: 400 }
  );
}

    }

    /* --------------------------------
       5. CREATE SLOT
    -------------------------------- */
    const slot = await prisma.slot.create({
      data: {
        serviceId,
        staffId,
        startTime: start,
        endTime: end,
        capacity,
        status: SlotStatus.ACTIVE,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        capacity: true,
        status: true,
        service: {
          select: { id: true, name: true, type: true },
        },
        staff: {
          select: { id: true, name: true, role: true },
        },
        createdAt: true,
      },
    });

    /* --------------------------------
       6. RESPONSE
    -------------------------------- */
    return NextResponse.json(
      {
        message: "Slot created successfully",
        slot,
      },
      { status: 201 }
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

    console.error("Create slot error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
