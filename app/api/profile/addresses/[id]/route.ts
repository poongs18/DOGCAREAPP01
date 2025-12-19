import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const schema = z.object({
  label: z.string().min(1).optional(),
  addressLine: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  postalCode: z.string().min(4).optional(),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  /* ----------------------------------------------------
     1. Extract & validate address ID (FIX)
  ---------------------------------------------------- */
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Address ID is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------
     2. Authenticate user
  ---------------------------------------------------- */
  let auth;
  try {
    auth = verifyAccessToken(req);
  } catch (err: any) {
    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { error: "Access token expired" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* ----------------------------------------------------
     3. Validate request body
  ---------------------------------------------------- */
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------
     4. Ownership check (CRITICAL)
  ---------------------------------------------------- */
  const existing = await prisma.address.findFirst({
    where: {
      id,
      userId: auth.sub,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Address not found" },
      { status: 404 }
    );
  }

  /* ----------------------------------------------------
     5. Build safe update object
  ---------------------------------------------------- */
  const data: any = {};

  if (parsed.data.label)
    data.label = sanitizeHtml(parsed.data.label);

  if (parsed.data.addressLine)
    data.addressLine = sanitizeHtml(parsed.data.addressLine);

  if (parsed.data.city)
    data.city = sanitizeHtml(parsed.data.city);

  if (parsed.data.state)
    data.state = sanitizeHtml(parsed.data.state);

  if (parsed.data.postalCode)
    data.postalCode = sanitizeHtml(parsed.data.postalCode);

  /* ----------------------------------------------------
     6. Update ONE address only
  ---------------------------------------------------- */
  const updated = await prisma.address.update({
    where: { id }, // ✅ guaranteed defined
    data,
  });

  /* ----------------------------------------------------
     7. Success response
  ---------------------------------------------------- */
  return NextResponse.json(
    {
      message: "Address updated successfully",
      address: updated,
    },
    { status: 200 }
  );
}
/* -----------------------------
   DELETE /api/profile/addresses/:id
----------------------------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  /* ----------------------------------------------------
     1. Extract address ID (FIX for App Router)
  ---------------------------------------------------- */
  const { id: addressId } = await context.params;

  if (!addressId) {
    return NextResponse.json(
      { error: "Address ID is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------
     2. AUTH (token + expiry handling)
  ---------------------------------------------------- */
  let auth;
  try {
    auth = verifyAccessToken(req);
  } catch (err: any) {
    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { error: "Access token expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* ----------------------------------------------------
     3. Ownership + existence check
  ---------------------------------------------------- */
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: auth.sub, // 🔐 ownership enforced
    },
  });

  if (!address) {
    return NextResponse.json(
      { error: "Address not found" },
      { status: 404 }
    );
  }

  /* ----------------------------------------------------
     4. Delete ONLY this address
  ---------------------------------------------------- */
  await prisma.address.delete({
    where: { id: addressId },
  });

  /* ----------------------------------------------------
     5. Success response
  ---------------------------------------------------- */
  return NextResponse.json(
    { message: "Address deleted successfully" },
    { status: 200 }
  );
}
