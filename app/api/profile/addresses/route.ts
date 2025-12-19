import { NextResponse } from "next/server";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  /* ----------------------------------------------------
     1. AUTH (token + expiry handling)
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
     2. Fetch addresses for logged-in user only
  ---------------------------------------------------- */
  const addresses = await prisma.address.findMany({
    where: {
      userId: auth.sub, // 🔐 ownership enforced
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  /* ----------------------------------------------------
     3. Success response
  ---------------------------------------------------- */
  return NextResponse.json(addresses, { status: 200 });
}

const schema = z.object({
  label: z.string().min(1),
  addressLine: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    /* ----------------------------------------------------
       1. Extract token
    ---------------------------------------------------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    /* ----------------------------------------------------
       2. Verify token safely
    ---------------------------------------------------- */
    let payload: any;

    try {
      payload = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!
      );
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return NextResponse.json(
          { error: "Access token expired" },
          { status: 401 }
        );
      }

      if (err instanceof JsonWebTokenError) {
        return NextResponse.json(
          { error: "Invalid access token" },
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

    /* ----------------------------------------------------
       4. Normalize & sanitize (IMPORTANT)
    ---------------------------------------------------- */
    const addressLine = sanitizeHtml(parsed.data.addressLine)
      .trim()
      .toLowerCase();

    const city = sanitizeHtml(parsed.data.city)
      .trim()
      .toLowerCase();

    const postalCode = sanitizeHtml(parsed.data.postalCode)
      .trim();

    const label = sanitizeHtml(parsed.data.label);
    const state = sanitizeHtml(parsed.data.state);

    /* ----------------------------------------------------
       5. Create address (DB enforces uniqueness)
    ---------------------------------------------------- */
    const addressCount = await prisma.address.count({
      where: { userId: payload.sub },
    });

    const address = await prisma.address.create({
      data: {
        userId: payload.sub,
        label,
        addressLine,
        city,
        state,
        postalCode,
        country: "India",
        isDefault: addressCount === 0, // first address
      },
    });

    /* ----------------------------------------------------
       6. Success response
    ---------------------------------------------------- */
    return NextResponse.json(
      { message: "Address added", address },
      { status: 201 }
    );

  } catch (error: any) {
    /* ----------------------------------------------------
       7. Handle DB uniqueness violation (KEY CHANGE)
    ---------------------------------------------------- */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Address already exists" },
        { status: 409 }
      );
    }

    console.error("Add address failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

