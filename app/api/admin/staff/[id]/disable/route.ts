import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role, AccountStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
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
       2. GET STAFF ID
    ----------------------------- */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Staff ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. DISABLE STAFF
    ----------------------------- */
    const staff = await prisma.user.updateMany({
      where: {
        id,
        role: {
          in: [Role.DOCTOR, Role.RECEPTIONIST],
        },
        status: AccountStatus.ACTIVE,
      },
      data: {
        status: AccountStatus.SUSPENDED,
      },
    });

    if (staff.count === 0) {
      return NextResponse.json(
        { message: "Staff not found or already disabled" },
        { status: 404 }
      );
    }

    /* -----------------------------
       4. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      { message: "Staff disabled successfully" },
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

    console.error("Disable staff error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}