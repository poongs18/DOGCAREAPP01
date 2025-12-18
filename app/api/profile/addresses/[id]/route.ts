import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const schema = z.object({
  label: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { sub: userId } = getUserFromToken(req);
  const body = await req.json();

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const address = await prisma.address.updateMany({
    where: { id: params.id, userId },
    data: {
      ...Object.fromEntries(
        Object.entries(parsed.data).map(([k, v]) => [
          k,
          typeof v === "string" ? sanitizeHtml(v) : v,
        ])
      ),
    },
  });

  if (address.count === 0) {
    return NextResponse.json(
      { error: "Address not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Address updated" });
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { sub: userId } = getUserFromToken(req);

  const deleted = await prisma.address.deleteMany({
    where: { id: params.id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Address not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Address deleted",
  });
}
