import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

export async function GET(req: Request) {
  let user;

  try {
    user = verifyAccessToken(req);
  } catch (err: any) {
    if (err.message === "TOKEN_MISSING") {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { error: "Access token expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // RBAC
  if (!["CUSTOMER", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(profile);
}

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
});

export async function PUT(req: Request) {
  /* ----------------------------------------------------
     1. AUTH (safe token handling)
  ---------------------------------------------------- */
  let auth;
  try {
    auth = verifyAccessToken(req);
  } catch (err: any) {
    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { error: "Access token expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* ----------------------------------------------------
     2. Validate request body
  ---------------------------------------------------- */
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------
     3. Build safe update payload
  ---------------------------------------------------- */
  const data: any = {};

  if (parsed.data.name) {
    data.name = sanitizeHtml(parsed.data.name);
  }

  if (parsed.data.phone) {
    data.phone = sanitizeHtml(parsed.data.phone);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------
     4. Update user (ownership enforced)
  ---------------------------------------------------- */
  const updatedUser = await prisma.user.update({
    where: {
      id: auth.sub, // 🔐 always from token, never from client
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  });

  /* ----------------------------------------------------
     5. Success response
  ---------------------------------------------------- */
  return NextResponse.json(
    {
      message: "Profile updated successfully",
      user: updatedUser,
    },
    { status: 200 }
  );
}
