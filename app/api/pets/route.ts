import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { Role } from "@/lib/rbac";
import { createPetSchema } from "@/lib/validators/pet.schema";
import { PetStatus } from "@prisma/client";

export async function GET(req: Request) {
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
       2. FETCH PETS
    ----------------------------- */
    const pets = await prisma.pet.findMany({
      where: {
        ownerId: auth.sub, // 🔐 ownership enforced
        status: PetStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        gender: true,
        age: true,
        weightKg: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    /* -----------------------------
       3. RESPONSE
    ----------------------------- */
    return NextResponse.json({ pets }, { status: 200 });
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

    console.error("Fetch pets error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    /* -----------------------------
       1. AUTH
    ----------------------------- */
    const auth = verifyAccessToken(req);

    if (auth.role !== Role.CUSTOMER) {
      return NextResponse.json(
        { message: "Only customers can add pets" },
        { status: 403 }
      );
    }

    /* -----------------------------
       2. VALIDATION
    ----------------------------- */
    const body = await req.json();
    const parsed = createPetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      species,
      breed,
      gender,
      age,
      weightKg,
      notes,
    } = parsed.data;

    /* -----------------------------
       3. CREATE PET
    ----------------------------- */
    const pet = await prisma.pet.create({
      data: {
        name,
        species,
        breed,
        gender,
        age,
        weightKg,
        notes,
        ownerId: auth.sub, // 🔐 ownership enforced
        status: PetStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        gender: true,
        age: true,
        weightKg: true,
        status: true,
        createdAt: true,
      },
    });

    /* -----------------------------
       4. RESPONSE
    ----------------------------- */
    return NextResponse.json(
      {
        message: "Pet added successfully",
        pet,
      },
      { status: 201 }
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

    console.error("Add pet error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
