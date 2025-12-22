import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@/lib/rbac";
import { createStaffSchema } from "@/lib/validators/admin-user.schema";
import { AccountStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    /* --------------------------------
       1. AUTHENTICATION
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
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role } = parsed.data;

    /* --------------------------------
       3. BUSINESS RULES
    -------------------------------- */
    // No additional checks needed as schema validates role

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    /* --------------------------------
       4. CREATE STAFF
    -------------------------------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        phone,
        role,
        status: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    /* --------------------------------
       5. RESPONSE
    -------------------------------- */
    return NextResponse.json(
      {
        message: "Staff created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.message === "TOKEN_MISSING" || err.message === "TOKEN_INVALID") {
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

    console.error("Create staff error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
       2. QUERY PARAM
    ----------------------------- */
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    if (!roleParam || !["DOCTOR", "RECEPTIONIST"].includes(roleParam)) {
      return NextResponse.json(
        { message: "role must be DOCTOR or RECEPTIONIST" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. FETCH STAFF
    ----------------------------- */
    const staffRole =
      roleParam === "DOCTOR" ? Role.DOCTOR : Role.RECEPTIONIST;
      
    const staff = await prisma.user.findMany({
      where: {
        role: staffRole,
        status: AccountStatus.ACTIVE, // only active staff
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

    console.error("List staff error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
