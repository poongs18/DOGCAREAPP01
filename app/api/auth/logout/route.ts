import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parse, serialize } from "cookie";
import pino from "pino";

const logger = pino({ level: "info" });

export async function POST(req: Request) {
  try {
    // 1. Read cookies
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      // Even if cookie is missing, return success (idempotent logout)
      return clearCookieAndRespond();
    }

    const cookies = parse(cookieHeader);
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return clearCookieAndRespond();
    }

    // 2. Revoke refresh token in DB (if exists)
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });

    logger.info("User logged out");

    // 3. Clear refresh token cookie
    return clearCookieAndRespond();
  } catch (error) {
    logger.error(error, "Logout failed");

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper to clear refresh token cookie and respond
 */
function clearCookieAndRespond() {
  const clearCookie = serialize("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // immediately expire
  });

  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  response.headers.set("Set-Cookie", clearCookie);
  return response;
}
