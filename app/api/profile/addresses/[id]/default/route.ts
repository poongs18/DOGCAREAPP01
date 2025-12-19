import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

/* -------------------------------------------
   PUT /api/profile/addresses/:id/default
------------------------------------------- */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  /* ----------------------------------------------------
     1. Extract addressId (App Router async params)
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
      userId: auth.sub,
    },
  });

  if (!address) {
    return NextResponse.json(
      { error: "Address not found" },
      { status: 404 }
    );
  }

  /* ----------------------------------------------------
     4. Transaction: ensure SINGLE default address
  ---------------------------------------------------- */
  await prisma.$transaction([
    // Reset all defaults for this user
    prisma.address.updateMany({
      where: {
        userId: auth.sub,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    }),

    // Set selected address as default
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  /* ----------------------------------------------------
     5. Success response
  ---------------------------------------------------- */
  return NextResponse.json(
    { message: "Default address updated successfully" },
    { status: 200 }
  );
}
