import { PrismaClient, ServiceStatus, ServiceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding services into DB:", process.env.DATABASE_URL);

  const services = [
    {
      name: "Grooming",
      description: "Bath, haircut, nail trimming",
      price: 1200,
      durationMin: 60,
      type: ServiceType.OPERATIONAL,
    },
    {
      name: "Swimming",
      description: "Supervised swimming session",
      price: 800,
      durationMin: 30,
      type: ServiceType.OPERATIONAL,
    },
    {
      name: "Training",
      description: "Basic obedience training",
      price: 1500,
      durationMin: 60,
      type: ServiceType.OPERATIONAL,
    },
    {
      name: "Vet Consultation",
      description: "Doctor consultation",
      price: 1000,
      durationMin: 20,
      type: ServiceType.MEDICAL,
    },
    {
      name: "Vaccination",
      description: "Routine dog vaccinations",
      price: 700,
      durationMin: 15,
      type: ServiceType.MEDICAL,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        price: service.price,
        durationMin: service.durationMin,
        status: ServiceStatus.ACTIVE,
      },
      create: {
        ...service,
        status: ServiceStatus.ACTIVE,
      },
    });
  }

  console.log("✅ Services seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
