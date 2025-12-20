import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@dogcare.com",
      passwordHash: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin created successfully");
}

main();
