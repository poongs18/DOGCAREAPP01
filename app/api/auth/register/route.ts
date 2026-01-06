import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { Prisma } from "@prisma/client";

const logger = console;


/**
 * Validation schema
 */
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let { name, email, password, phone } = parsed.data;

    // 2. Sanitize inputs
    name = sanitizeHtml(name);
    email = sanitizeHtml(email);
    if (phone) phone = sanitizeHtml(phone);

    // 3. Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // 4. Check existing phone (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "Phone number already registered" },
          { status: 400 }
        );
      }
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info({ userId: user.id }, "User registered successfully");

    // 7. Response
    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(error, "Register API failed");

    // Prisma unique constraint safety (race condition handling)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target as string[] | undefined;

      if (target?.includes("email")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      }

      if (target?.includes("phone")) {
        return NextResponse.json(
          { error: "Phone number already registered" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
