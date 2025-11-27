// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const clinics = await prisma.$transaction([
    prisma.clinic.upsert({ where: { id: "seed-north" }, update: {}, create: { id: "seed-north", name: "North Dental" } }),
    prisma.clinic.upsert({ where: { id: "seed-river" }, update: {}, create: { id: "seed-river", name: "River Smiles" } }),
    prisma.clinic.upsert({ where: { id: "seed-harbor" }, update: {}, create: { id: "seed-harbor", name: "Harbor Family Dental" } }),
  ]);
  const [north, river, harbor] = clinics;

  const pw = await bcrypt.hash("password123", 10);

  await prisma.$transaction([
    prisma.user.upsert({
      where: { email: "dr.north.1@example.com" },
      update: {},
      create: { email: "dr.north.1@example.com", name: "Dr. North One", password: pw, role: "customer", clinicId: north.id },
    }),
    prisma.user.upsert({
      where: { email: "dr.north.2@example.com" },
      update: {},
      create: { email: "dr.north.2@example.com", name: "Dr. North Two", password: pw, role: "customer", clinicId: north.id },
    }),
    prisma.user.upsert({
      where: { email: "dr.river.1@example.com" },
      update: {},
      create: { email: "dr.river.1@example.com", name: "Dr. River One", password: pw, role: "customer", clinicId: river.id },
    }),
    prisma.user.upsert({
      where: { email: "dr.river.2@example.com" },
      update: {},
      create: { email: "dr.river.2@example.com", name: "Dr. River Two", password: pw, role: "customer", clinicId: river.id },
    }),
    prisma.user.upsert({
      where: { email: "dr.harbor.1@example.com" },
      update: {},
      create: { email: "dr.harbor.1@example.com", name: "Dr. Harbor One", password: pw, role: "customer", clinicId: harbor.id },
    }),
    prisma.user.upsert({
      where: { email: "dr.harbor.2@example.com" },
      update: {},
      create: { email: "dr.harbor.2@example.com", name: "Dr. Harbor Two", password: pw, role: "customer", clinicId: harbor.id },
    }),

    prisma.user.upsert({
      where: { email: "lab@lumera.test" },
      update: {},
      create: { email: "lab@lumera.test", name: "Lumera Lab", password: pw, role: "lab" },
    }),
    prisma.user.upsert({
      where: { email: "admin@lumera.test" },
      update: {},
      create: { email: "admin@lumera.test", name: "Lumera Admin", password: pw, role: "admin" },
    }),
  ]);

  console.log("Seed complete. Password for all: password123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
