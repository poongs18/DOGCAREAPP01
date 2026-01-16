import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { updatePetSchema } from "@/lib/validators/pet.schema";
import { Role, PetStatus } from "@prisma/client";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    /* -----------------------------
       1. AUTH
    ----------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.CUSTOMER) {
      return NextResponse.json(
        { message: "Only customers can view pets" },
        { status: 403 }
      );
    }

    /* -----------------------------
       2. PARAM
    ----------------------------- */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Pet ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. FETCH PET (OWNERSHIP ENFORCED)
    ----------------------------- */
    const pet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: auth.sub,          // 🔐 ownership enforced
        status: PetStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        breed: true,
        gender: true,
        age: true,
        weightKg: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!pet) {
      // Either pet doesn't exist OR doesn't belong to user
      return NextResponse.json(
        { message: "Pet not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       4. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      { pet },
      { status: 200 }
    );
  } catch (err: any) {
    if (
      err.message === "TOKEN_MISSING" ||
      err.message === "TOKEN_INVALID"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { message: "Token expired" },
        { status: 401 }
      );
    }

    console.error("View pet error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    /* -----------------------------
       1. AUTH
    ----------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.CUSTOMER) {
      return NextResponse.json(
        { message: "Only customers can update pets" },
        { status: 403 }
      );
    }

    /* -----------------------------
       2. PARAM
    ----------------------------- */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Pet ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. VALIDATION
    ----------------------------- */
    const body = await req.json();
    const parsed = updatePetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { message: "No fields provided to update" },
        { status: 400 }
      );
    }

    /* -----------------------------
       4. OWNERSHIP CHECK
    ----------------------------- */
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: auth.sub,
        status: PetStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!existingPet) {
      return NextResponse.json(
        { message: "Pet not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       5. UPDATE PET
    ----------------------------- */
    const updatedPet = await prisma.pet.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        breed: true,
        gender: true,
        age: true,
        weightKg: true,
        notes: true,
        status: true,
        updatedAt: true,
      },
    });

    /* -----------------------------
       6. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      {
        message: "Pet updated successfully",
        pet: updatedPet,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (
      err.message === "TOKEN_MISSING" ||
      err.message === "TOKEN_INVALID"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { message: "Token expired" },
        { status: 401 }
      );
    }

    console.error("Update pet error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    /* -----------------------------
       1. AUTH
    ----------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.CUSTOMER) {
      return NextResponse.json(
        { message: "Only customers can delete pets" },
        { status: 403 }
      );
    }

    /* -----------------------------
       2. PARAM
    ----------------------------- */
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Pet ID is required" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. OWNERSHIP CHECK
    ----------------------------- */
    const pet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: auth.sub,
        status: PetStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!pet) {
      // Either not found or not owned by user
      return NextResponse.json(
        { message: "Pet not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       4. SOFT DELETE
    ----------------------------- */
    await prisma.pet.update({
      where: { id },
      data: {
        status: PetStatus.INACTIVE,
      },
    });

    /* -----------------------------
       5. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      { message: "Pet deleted successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    if (
      err.message === "TOKEN_MISSING" ||
      err.message === "TOKEN_INVALID"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "TOKEN_EXPIRED") {
      return NextResponse.json(
        { message: "Token expired" },
        { status: 401 }
      );
    }

    console.error("Delete pet error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}