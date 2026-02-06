// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. WIPE DATABASE (Order matters due to foreign keys)
  // Delete dependent tables first
  await prisma.caseFile.deleteMany();
  await prisma.caseComment.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.dentalCase.deleteMany();
  
  // Delete users and core entities
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.address.deleteMany();
  await prisma.registrationRequest.deleteMany();
  
  console.log("🧹 Database cleared.");

  // 2. GLOBAL PASSWORD
  const pw = await bcrypt.hash("password123", 10);

  // 3. CREATE CLINICS
  const north = await prisma.clinic.create({
    data: { name: "North Dental", priceTier: "IN_HOUSE" }
  });
  
  const river = await prisma.clinic.create({
    data: { name: "River Smiles", priceTier: "STANDARD" }
  });
  
  const harbor = await prisma.clinic.create({
    data: { name: "Harbor Family Dental", priceTier: "STANDARD" }
  });

  const hausMilling = await prisma.clinic.create({
    data: { name: "Haus Milling Center", priceTier: "IN_HOUSE" }
  });

  // 4. CREATE USERS
  await prisma.$transaction([
    // --- INTERNAL ROLES ---
    
    // Admin
    prisma.user.create({
      data: { 
        email: "admin@test.com", 
        name: "Lumera Admin", 
        password: pw, 
        role: "admin" 
      },
    }),

    // Lab Tech
    prisma.user.create({
      data: { 
        email: "lab@test.com", 
        name: "Lumera Lab Tech", 
        password: pw, 
        role: "lab" 
      },
    }),

    // Milling Center (Haus)
    prisma.user.create({
      data: { 
        email: "haus@test.com", 
        name: "Haus Milling", 
        password: pw, 
        role: "milling", 
        clinicId: hausMilling.id 
      },
    }),

    // ✅ NEW: Sales Rep
    prisma.user.create({
      data: { 
        email: "sales@test.com", 
        name: "Sales Rep One", 
        password: pw, 
        role: "sales" 
      },
    }),

    // --- DOCTORS (CUSTOMERS) ---

    // Dr. North (In-House Pricing)
    prisma.user.create({
      data: { 
        email: "dr.north@test.com", 
        name: "Dr. North", 
        password: pw, 
        role: "customer", 
        clinicId: north.id 
      },
    }),

    // Dr. River (Standard Pricing)
    prisma.user.create({
      data: { 
        email: "dr.river@test.com", 
        name: "Dr. River", 
        password: pw, 
        role: "customer", 
        clinicId: river.id 
      },
    }),

    // Dr. Harbor (Standard Pricing)
    prisma.user.create({
      data: { 
        email: "dr.harbor@test.com", 
        name: "Dr. Harbor", 
        password: pw, 
        role: "customer", 
        clinicId: harbor.id 
      },
    }),
  ]);

  console.log("✅ Seed complete!");
  console.log("------------------------------------------------");
  console.log("Admin:   admin@test.com");
  console.log("Lab:     lab@test.com");
  console.log("Milling: haus@test.com");
  console.log("Sales:   sales@test.com");
  console.log("Doctor:  dr.north@test.com (In-House)");
  console.log("Doctor:  dr.river@test.com (Standard)");
  console.log("Password for all: password123");
  console.log("------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });