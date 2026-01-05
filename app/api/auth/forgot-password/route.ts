import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
const logger = console;


const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // IMPORTANT: Do NOT reveal whether email exists
    if (!user) {
      return NextResponse.json(
        { message: "If the email exists, a reset link will be sent" },
        { status: 200 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    // Simulate email (for now)
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    logger.info({ resetUrl }, "Password reset link");

    return NextResponse.json(
      { message: "If the email exists, a reset link will be sent" },
      { status: 200 }
    );
  } catch (error) {
    logger.error(error, "Forgot password failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
