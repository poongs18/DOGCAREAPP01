import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@/lib/rbac";
import { AccountStatus } from "@prisma/client";

export async function GET(req: Request) {
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
       2. FETCH CUSTOMERS
    ----------------------------- */
    const customers = await prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
        status: {
          not: AccountStatus.DELETED,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    /* -----------------------------
       3. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      { customers },
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

    console.error("List customers error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
