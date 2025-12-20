import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAccessToken(req);
    if (auth.role !== Role.ADMIN) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { role } = await req.json();

    if (!["DOCTOR", "RECEPTIONIST"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json({ message: "Role updated" });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
