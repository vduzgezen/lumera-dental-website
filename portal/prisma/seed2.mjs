// prisma/seed_haus.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "haus@milling.com";
  
  // Check if exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Haus account already exists.");
    return;
  }

  // Create a dedicated clinic for the milling center
  const clinic = await prisma.clinic.create({
    data: {
      name: "Haus Milling Center",
      priceTier: "In-House"
    }
  });

  // Create the user
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  await prisma.user.create({
    data: {
      email,
      name: "Haus Milling",
      password: hashedPassword,
      role: "milling", // <--- The new role
      clinicId: clinic.id,
      phoneNumber: "555-0199",
    },
  });

  console.log("Created haus@milling.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });