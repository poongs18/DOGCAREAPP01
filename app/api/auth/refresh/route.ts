import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { Secret, JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { parse } from "cookie";
const logger = console;


// Strongly typed secrets (same pattern as login)
const accessSecret: Secret = process.env.JWT_ACCESS_SECRET as string;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;

export async function POST(req: Request) {
  try {
    // 1. Read cookie header
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json(
        { error: "Refresh token missing" },
        { status: 401 }
      );
    }

    const cookies = parse(cookieHeader);
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token missing" },
        { status: 401 }
      );
    }

    // 2. Verify refresh token JWT
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const userId = payload.sub as string;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 3. Validate refresh token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked) {
      return NextResponse.json(
        { error: "Refresh token revoked" },
        { status: 401 }
      );
    }

    if (storedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    // 4. Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "User not active" },
        { status: 401 }
      );
    }

    // 5. Generate NEW access token (IMPORTANT PART)
    const newAccessToken = jwt.sign(
      { sub: user.id, role: user.role },
      accessSecret,
      { expiresIn: "15m" } // literal value avoids overload issues
    );

    logger.info({ userId }, "Access token refreshed");

    // 6. Return new access token
    return NextResponse.json(
      {
        message: "Access token refreshed",
        accessToken: newAccessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(error, "Refresh token failed");

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
