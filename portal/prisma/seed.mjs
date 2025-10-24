// prisma/seed.mjs (ESM)
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  // Clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: 'seed-north' },
    update: {},
    create: { id: 'seed-north', name: 'North Dental' },
  });

  // Users
  const pwHash = await hash('Passw0rd!', { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  await prisma.user.upsert({
    where: { email: 'admin@lumera.dental' },
    update: {},
    create: { email: 'admin@lumera.dental', password: pwHash, role: 'admin' },
  });
  await prisma.user.upsert({
    where: { email: 'tech@lumera.dental' },
    update: {},
    create: { email: 'tech@lumera.dental', password: pwHash, role: 'lab' },
  });
  await prisma.user.upsert({
    where: { email: 'doc@northdental.com' },
    update: {},
    create: { email: 'doc@northdental.com', password: pwHash, role: 'customer', clinicId: clinic.id },
  });

  // Cases
  const cases = [
    { patientAlias: 'PAT-001', toothCodes: '#19',   status: 'NEW',                dueDate: daysFromNow(3)  },
    { patientAlias: 'PAT-002', toothCodes: '#8,#9', status: 'IN_DESIGN',          dueDate: daysFromNow(5)  },
    { patientAlias: 'PAT-003', toothCodes: '#30',   status: 'READY_FOR_REVIEW',   dueDate: daysFromNow(2)  },
    { patientAlias: 'PAT-004', toothCodes: '#14',   status: 'CHANGES_REQUESTED',  dueDate: daysFromNow(7)  },
    { patientAlias: 'PAT-005', toothCodes: '#3',    status: 'APPROVED',           dueDate: daysFromNow(1)  },
    { patientAlias: 'PAT-006', toothCodes: '#22',   status: 'IN_MILLING',         dueDate: daysFromNow(4)  },
  ];

  for (const c of cases) {
    await prisma.dentalCase.create({
      data: {
        clinicId: clinic.id,
        patientAlias: c.patientAlias,
        toothCodes: c.toothCodes,
        status: c.status,
        dueDate: c.dueDate,
        files: {
          create: [{ kind: 'PHOTO', url: '/images/sample1.jpg' }],
        },
        events: {
          create: [
            { from: null, to: 'NEW' },
            ...(c.status !== 'NEW' ? [{ from: 'NEW', to: c.status }] : []),
          ],
        },
      },
    });
  }
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
