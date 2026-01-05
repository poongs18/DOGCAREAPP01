import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role, AccountStatus } from "@prisma/client";

export async function GET(
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
       2. GET ID (Next.js App Router)
    ----------------------------- */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Staff ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. FETCH STAFF (PERFORMANCE SAFE)
    ----------------------------- */
    const staff = await prisma.user.findFirst({
      where: {
        id,
        role: {
          in: [Role.DOCTOR, Role.RECEPTIONIST],
        },
        status: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { message: "Staff not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       4. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      { staff },
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

    console.error("View staff error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}