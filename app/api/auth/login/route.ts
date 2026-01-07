import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serialize } from "cookie";
import { withCors } from "@/lib/cors";

const logger = console;


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Strongly typed secrets
const accessSecret: Secret = process.env.JWT_ACCESS_SECRET as string;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate request
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
      );
    }

    const { email, password } = parsed.data;

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== "ACTIVE") {
      return withCors(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      );
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return withCors(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      );
    }

    // 4. Generate access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        aud: "dogcare-client",
        iss: "dogcare-api",
      },
      accessSecret,
      { expiresIn: "15m" }
    );

    // 5. Generate refresh token
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        aud: "dogcare-client",
        iss: "dogcare-api",
      },
      refreshSecret,
      { expiresIn: "7d" }
    );

    // 6. Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 7. Secure refresh cookie
    const refreshCookie = serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // change to "none" if frontend is on another domain
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", refreshCookie);

    return withCors(response);
  } catch (error) {
    logger.error(error, "Login failed");

    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

