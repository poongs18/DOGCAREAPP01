import { PrismaClient, ServiceStatus, ServiceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding services & variants into DB:", process.env.DATABASE_URL);

  // 1️⃣ Service categories
  const services = [
    { name: "Grooming", type: ServiceType.OPERATIONAL },
    { name: "Swimming", type: ServiceType.OPERATIONAL },
    { name: "Training", type: ServiceType.OPERATIONAL },
    { name: "Vet Consultation", type: ServiceType.MEDICAL },
    { name: "Vaccination", type: ServiceType.MEDICAL },
  ];

  const serviceMap: Record<string, string> = {};

  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { name: service.name },
      update: {
        type: service.type,
        status: ServiceStatus.ACTIVE,
      },
      create: {
        name: service.name,
        type: service.type,
        status: ServiceStatus.ACTIVE,
      },
    });

    serviceMap[service.name] = created.id;
  }

  // 2️⃣ Service variants (dog-only)
  const variants = [
    // Grooming
    {
      service: "Grooming",
      name: "Basic Bath – Small Breed",
      price: 1099,
      durationMin: 40,
    },
    {
      service: "Grooming",
      name: "Basic Bath – Medium Breed",
      price: 1299,
      durationMin: 45,
    },
    {
      service: "Grooming",
      name: "Basic Bath – Large Breed",
      price: 1599,
      durationMin: 60,
    },
    {
      service: "Grooming",
      name: "Premium Bath – Small Breed",
      price: 1399,
      durationMin: 45,
    },
    {
      service: "Grooming",
      name: "Haircut & Bath – Medium Breed",
      price: 1799,
      durationMin: 60,
    },
    {
      service: "Grooming",
      name: "Haircut & Bath – Large Breed",
      price: 2199,
      durationMin: 75,
    },
    {
      service: "Grooming",
      name: "Tick Bath & Haircut – Large Breed",
      price: 2749,
      durationMin: 90,
    },

    // Swimming
    {
      service: "Swimming",
      name: "Swimming Session – 30 Minutes",
      price: 800,
      durationMin: 30,
    },

    // Training
    {
      service: "Training",
      name: "Basic Obedience Training – 1 Hour",
      price: 1500,
      durationMin: 60,
    },

    // Vet
    {
      service: "Vet Consultation",
      name: "General Vet Consultation",
      price: 1000,
      durationMin: 20,
    },

    // Vaccination
    {
      service: "Vaccination",
      name: "Routine Vaccination",
      price: 700,
      durationMin: 15,
    },
  ];

  for (const variant of variants) {
    await prisma.serviceVariant.upsert({
      where: { name: variant.name },
      update: {
        price: variant.price,
        durationMin: variant.durationMin,
        isActive: true,
      },
      create: {
        name: variant.name,
        price: variant.price,
        durationMin: variant.durationMin,
        isActive: true,
        serviceId: serviceMap[variant.service],
      },
    });
  }

  console.log("✅ Services & variants seeded successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
