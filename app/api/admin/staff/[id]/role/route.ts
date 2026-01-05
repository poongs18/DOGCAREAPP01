import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { role } = await req.json();

    if (!["DOCTOR", "RECEPTIONIST"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    const { id } = await context.params;

    await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(
      { message: "Role updated" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
