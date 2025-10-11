// prisma/seed.mjs (ESM)
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  // Create one clinic
  const clinic = await prisma.clinic.create({
    data: { name: 'North Dental' },
  });

  // Hash a demo password once and reuse it
  const pwHash = await hash('Passw0rd!', {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // Users
  await prisma.user.create({
    data: { email: 'admin@lumera.dental', password: pwHash, role: 'admin' },
  });

  await prisma.user.create({
    data: { email: 'tech@lumera.dental', password: pwHash, role: 'lab' },
  });

  await prisma.user.create({
    data: {
      email: 'doc@northdental.com',
      password: pwHash,
      role: 'customer',
      clinicId: clinic.id,
    },
  });
}

try {
  await main();
  console.log('Seed complete');
} catch (e) {
  console.error('Seed error:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
