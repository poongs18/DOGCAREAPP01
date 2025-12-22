import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationMin: true,
        type: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      { services },
      { status: 200 }
    );
  } catch (err) {
    console.error("Get services error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
