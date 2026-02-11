// prisma/seed3.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to pick random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate random integers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate dates in the past
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// Data Constants (Matching your Schema Enums)
const PRODUCTS = ["ZIRCONIA", "EMAX", "NIGHTGUARD", "INLAY_ONLAY"];
const STATUS_FLOW = [
  "IN_DESIGN", 
  "APPROVED", 
  "IN_MILLING", 
  "SHIPPED", 
  "COMPLETED", 
  "DELIVERED"
];

async function main() {
  console.log("🚀 Starting Seed 3: Volume Injection...");

  // 1. Fetch Existing Doctors & System Users
  const doctors = await prisma.user.findMany({
    where: { role: "customer" },
    include: { clinic: true }
  });

  const salesRep = await prisma.user.findFirst({ where: { role: "sales" } });
  const labUser = await prisma.user.findFirst({ where: { role: "lab" } });

  if (doctors.length === 0) {
    console.error("❌ No doctors found. Please run 'node prisma/seed.mjs' first.");
    process.exit(1);
  }

  console.log(`👨‍⚕️ Found ${doctors.length} doctors to assign cases to.`);

  // 2. Generate 150 Cases
  const CASES_TO_GENERATE = 150;
  const newCases = [];

  for (let i = 0; i < CASES_TO_GENERATE; i++) {
    const doc = randomItem(doctors);
    const product = randomItem(PRODUCTS);
    const status = randomItem(STATUS_FLOW);
    
    // Determine Stage based on Status
    let stage = "DESIGN";
    if (status === "IN_MILLING") stage = "MILLING_GLAZING";
    if (status === "SHIPPED") stage = "SHIPPING";
    if (status === "COMPLETED") stage = "COMPLETED";
    if (status === "DELIVERED") stage = "DELIVERED";

    // Randomize Dates to test sorting
    const createdDate = daysAgo(randomInt(1, 120)); // Created 1-120 days ago
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 10); // Due 10 days after creation

    // Material logic
    let material = null;
    if (product === "ZIRCONIA") material = randomItem(["HT", "ML"]);
    if (product === "NIGHTGUARD") material = randomItem(["HARD", "SOFT"]);

    // Cost logic (Mock pricing)
    let cost = 50;
    if (product === "EMAX") cost = 110;
    if (doc.clinic.priceTier === "IN_HOUSE") cost -= 10;
    const units = randomInt(1, 3);

    // Optional: Shipping Info for Finance Testing
    // (Only for shipped/completed cases)
    let shippingCost = 0;
    let shippingBatchId = null;
    let trackingNumber = null;
    let shippingCarrier = null;
    let shippedAt = null;

    if (["SHIPPED", "COMPLETED", "DELIVERED"].includes(status)) {
        shippingCost = 15.00 / units; // Simple distribution
        // Create a fake batch ID every ~5 cases to group them
        shippingBatchId = `batch_seed3_${Math.floor(i / 5)}`; 
        trackingNumber = `1ZTEST${Math.floor(i / 5)}999`;
        shippingCarrier = "UPS";
        shippedAt = daysAgo(randomInt(1, 30));
    }

    newCases.push({
      clinicId: doc.clinicId,
      doctorUserId: doc.id,
      salesRepId: salesRep?.id || null,
      assigneeId: labUser?.id || null,
      
      patientAlias: `BULK-${i + 1000}`,
      patientFirstName: `TestPatient`,
      patientLastName: `${i}`,
      doctorName: doc.name,
      
      toothCodes: `${randomInt(2, 15)},${randomInt(18, 31)}`,
      product,
      material,
      serviceLevel: doc.clinic.priceTier === "IN_HOUSE" ? "IN_HOUSE" : "STANDARD",
      shade: "A2",
      
      status,
      stage,
      
      orderDate: createdDate,
      dueDate: dueDate,
      createdAt: createdDate,
      updatedAt: createdDate,
      
      units,
      cost: cost * units,
      
      // Finance Fields (If your schema migration has been applied)
      shippingCost,
      shippingBatchId,
      trackingNumber,
      shippingCarrier,
      shippedAt
    });
  }

  // 3. Batch Insert
  // We use createMany for speed
  await prisma.dentalCase.createMany({
    data: newCases
  });

  console.log(`✅ Successfully created ${CASES_TO_GENERATE} extra cases.`);
  console.log("👉 Go to the Dashboard to test the 'Load More' button!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });