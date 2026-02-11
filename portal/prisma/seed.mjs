import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Master Seed (Reset & Base Accounts)...");

  // 1. WIPE DATABASE
  // Delete dependent tables first to avoid foreign key constraints
  await prisma.caseFile.deleteMany();
  await prisma.caseComment.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.dentalCase.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  
  // Delete users and core entities
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.address.deleteMany();
  await prisma.registrationRequest.deleteMany();
  
  console.log("🧹 Database cleared.");

  // 2. GLOBAL PASSWORD
  const pw = await bcrypt.hash("password123", 10);

  // 3. CREATE SHARED ADDRESSES
  const addrNorth = await prisma.address.create({
    data: { street: "101 Frozen Way", city: "Anchorage", state: "AK", zipCode: "99501" }
  });
  const addrRiver = await prisma.address.create({
    data: { street: "500 Flowing St", city: "Riverside", state: "CA", zipCode: "92501" }
  });
  const addrHarbor = await prisma.address.create({
    data: { street: "88 Pier Blvd", city: "Boston", state: "MA", zipCode: "02110" }
  });
  const addrHaus = await prisma.address.create({
    data: { street: "1 Production Ln", city: "Detroit", state: "MI", zipCode: "48201" }
  });
  const addrLab = await prisma.address.create({
    data: { street: "500 Tech Blvd", city: "San Francisco", state: "CA", zipCode: "94105" }
  });

  // 4. CREATE CLINICS
  const north = await prisma.clinic.create({
    data: { 
      name: "North Dental", 
      phone: "(907) 555-0101",
      addressId: addrNorth.id,
      priceTier: "IN_HOUSE" 
    }
  });
  
  const river = await prisma.clinic.create({
    data: { 
      name: "River Smiles", 
      phone: "(951) 555-0202",
      addressId: addrRiver.id,
      priceTier: "STANDARD" 
    }
  });
  
  const harbor = await prisma.clinic.create({
    data: { 
      name: "Harbor Family Dental", 
      phone: "(617) 555-0303",
      addressId: addrHarbor.id,
      priceTier: "STANDARD" 
    }
  });

  const hausMilling = await prisma.clinic.create({
    data: { 
      name: "Haus Milling Center", 
      phone: "(313) 555-9999",
      addressId: addrHaus.id,
      priceTier: "IN_HOUSE" 
    }
  });

  // 5. CREATE USERS
  await prisma.$transaction([
    // --- INTERNAL ROLES ---
    
    // Admin
    prisma.user.create({
      data: { 
        email: "admin@test.com", 
        name: "Lumera Admin", 
        password: pw, 
        role: "admin",
        phoneNumber: "(800) 555-ADMIN",
        addressId: addrLab.id
      },
    }),

    // Lab Tech
    prisma.user.create({
      data: { 
        email: "lab@test.com", 
        name: "Lumera Lab Tech", 
        password: pw, 
        role: "lab",
        phoneNumber: "(800) 555-LABS",
        addressId: addrLab.id
      },
    }),

    // Milling Center (Haus)
    prisma.user.create({
      data: { 
        email: "haus@test.com", 
        name: "Haus Milling Manager", 
        password: pw, 
        role: "milling", 
        phoneNumber: "(313) 555-HAUS",
        clinicId: hausMilling.id,
        addressId: addrHaus.id
      },
    }),

    // Sales Rep
    prisma.user.create({
      data: { 
        email: "sales@test.com", 
        name: "Sales Rep One", 
        password: pw, 
        role: "sales",
        phoneNumber: "(212) 555-SALE",
        addressId: addrLab.id
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
        phoneNumber: "(907) 555-1111",
        clinicId: north.id,
        addressId: addrNorth.id,
        preferenceNote: "Prefers tight contacts on molars."
      },
    }),

    // Dr. River (Standard Pricing)
    prisma.user.create({
      data: { 
        email: "dr.river@test.com", 
        name: "Dr. River", 
        password: pw, 
        role: "customer", 
        phoneNumber: "(951) 555-2222",
        clinicId: river.id,
        addressId: addrRiver.id
      },
    }),

    // Dr. Harbor (Standard Pricing)
    prisma.user.create({
      data: { 
        email: "dr.harbor@test.com", 
        name: "Dr. Harbor", 
        password: pw, 
        role: "customer", 
        phoneNumber: "(617) 555-3333",
        clinicId: harbor.id,
        addressId: addrHarbor.id,
        defaultDesignPreferences: "Open embrasures, light occlusion."
      },
    }),
  ]);

  console.log("✅ Base accounts created!");
  console.log("------------------------------------------------");
  console.log("Admin:   admin@test.com");
  console.log("Lab:     lab@test.com");
  console.log("Milling: haus@test.com");
  console.log("Sales:   sales@test.com");
  console.log("Doctors: dr.north@test.com, dr.river@test.com, dr.harbor@test.com");
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