import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  const payload = jwt.verify(
    token!,
    process.env.JWT_ACCESS_SECRET!
  ) as any;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
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

  return NextResponse.json(user);
}

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function PUT(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  const payload = jwt.verify(
    token!,
    process.env.JWT_ACCESS_SECRET!
  ) as any;

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data: any = {};
  if (parsed.data.name)
    data.name = sanitizeHtml(parsed.data.name);
  if (parsed.data.phone)
    data.phone = sanitizeHtml(parsed.data.phone);

  const updatedUser = await prisma.user.update({
    where: { id: payload.sub },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  return NextResponse.json({
    message: "Profile updated",
    user: updatedUser,
  });
}
