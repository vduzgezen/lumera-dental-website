// prisma/seed2.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Wiping existing test data...");
  // Wiping cases to give you a clean slate for the test
  await prisma.dentalCase.deleteMany({});
  await prisma.clinic.deleteMany({});

  console.log("🏥 Creating test clinic...");
  const clinic = await prisma.clinic.create({
    data: {
      name: "North Dental Clinic",
    }
  });

  // Set up controlled dates
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); 

  // A date right in the middle of the current month
  const thisMonthDate = new Date(currentYear, currentMonth, 15);
  // A date in the middle of last month
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 15);

  console.log("🦷 Seeding controlled test cases...");

  // CASE 1: Current Month, Active (Should be in billing and dashboard)
  await prisma.dentalCase.create({
    data: {
      patientAlias: "BILL-001",
      patientFirstName: "Active",
      patientLastName: "Patient",
      doctorName: "Dr. North",
      clinicId: clinic.id,
      orderDate: thisMonthDate,
      status: "DESIGN", 
      product: "ZIRCONIA",
      units: 3,
      cost: 300.00,
      billingType: "BILLABLE",
      toothCodes: "8, 9, 10"
    }
  });

  // CASE 2: Current Month, Completed (Should be in billing and dashboard)
  await prisma.dentalCase.create({
    data: {
      patientAlias: "BILL-002",
      patientFirstName: "Done",
      patientLastName: "Patient",
      doctorName: "Dr. North",
      clinicId: clinic.id,
      orderDate: thisMonthDate,
      status: "COMPLETED",
      product: "EMAX",
      units: 1,
      cost: 150.00,
      billingType: "BILLABLE",
      toothCodes: "4"
    }
  });

  // CASE 3: Current Month, Cancelled (Should NOT be in billing, but ON dashboard)
  await prisma.dentalCase.create({
    data: {
      patientAlias: "BILL-003",
      patientFirstName: "Cancelled",
      patientLastName: "Patient",
      doctorName: "Dr. North",
      clinicId: clinic.id,
      orderDate: thisMonthDate,
      status: "CANCELLED",
      product: "NIGHTGUARD",
      units: 1,
      cost: 80.00,
      billingType: "BILLABLE",
      toothCodes: ""
    }
  });

  // CASE 4: Last Month, Active (Should NOT be in current month billing, but ON dashboard)
  await prisma.dentalCase.create({
    data: {
      patientAlias: "BILL-004",
      patientFirstName: "Past",
      patientLastName: "Patient",
      doctorName: "Dr. North",
      clinicId: clinic.id,
      orderDate: lastMonthDate,
      status: "MILLING_GLAZING",
      product: "ZIRCONIA",
      units: 2,
      cost: 200.00,
      billingType: "BILLABLE",
      toothCodes: "18, 19"
    }
  });

  console.log("✅ Seeding complete!");
  console.log("--------------------------------------------------");
  console.log("EXPECTED MAIN DASHBOARD COUNT: 4 Total Cases");
  console.log("EXPECTED BILLING COUNT (CURRENT MONTH): 2 Cases, 4 Units, $450 Total");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });