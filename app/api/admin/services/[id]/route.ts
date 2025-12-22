import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@/lib/rbac";
import { updateServiceSchema } from "@/lib/validators/service.schema";

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    /* -----------------------------
       1. AUTH
    ----------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    /* -----------------------------
       2. PARAM
    ----------------------------- */
    const serviceId = context.params?.id;

    if (!serviceId) {
      return NextResponse.json(
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. VALIDATION
    ----------------------------- */
    const body = await req.json();
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    /* -----------------------------
       4. CHECK EXISTENCE
    ----------------------------- */
    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       5. UPDATE
    ----------------------------- */
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        price: true,
        durationMin: true,
        status: true,
        updatedAt: true,
      },
    });

    /* -----------------------------
       6. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      {
        message: "Service updated successfully",
        service,
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

    console.error("Update service error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
