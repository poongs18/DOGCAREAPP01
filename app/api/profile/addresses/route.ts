import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

export async function GET(req: Request) {
  const token = req.headers
    .get("authorization")
    ?.split(" ")[1];

  const payload = jwt.verify(
    token!,
    process.env.JWT_ACCESS_SECRET!
  ) as any;

  const addresses = await prisma.address.findMany({
    where: { userId: payload.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addresses);
}

const schema = z.object({
  label: z.string(),
  addressLine: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
});

export async function POST(req: Request) {
  const token = req.headers
    .get("authorization")
    ?.split(" ")[1];

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

  const address = await prisma.address.create({
    data: {
      userId: payload.sub,
      label: sanitizeHtml(parsed.data.label),
      addressLine: sanitizeHtml(parsed.data.addressLine),
      city: sanitizeHtml(parsed.data.city),
      state: sanitizeHtml(parsed.data.state),
      postalCode: sanitizeHtml(parsed.data.postalCode),
      country: "India",
    },
  });

  return NextResponse.json(
    { message: "Address added", address },
    { status: 201 }
  );
}

