import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const PRODUCTS = ["ZIRCONIA", "EMAX", "NIGHTGUARD", "INLAY_ONLAY"];
const MATERIALS = {
  "ZIRCONIA": ["HT", "ML"],
  "EMAX": [null],
  "NIGHTGUARD": ["HARD", "SOFT"],
  "INLAY_ONLAY": [null]
};

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

async function main() {
  console.log("🚀 Starting Volume Data Injection...");

  // 1. FETCH BASE USERS
  const doctors = await prisma.user.findMany({
    where: { role: "customer" },
    include: { clinic: true }
  });

  const salesRep = await prisma.user.findFirst({ where: { role: "sales" } });
  const labUser = await prisma.user.findFirst({ where: { role: "lab" } });

  if (doctors.length === 0) {
    console.error("❌ No doctors found. Run seed.mjs first!");
    process.exit(1);
  }

  // 2. GENERATE CASES
  const CASES_TO_CREATE = 60;
  const BATCHES_TO_CREATE = 8;
  const batches = [];

  // Create Shipping Batches (Past 30 days)
  for (let i = 0; i < BATCHES_TO_CREATE; i++) {
    batches.push({
      id: crypto.randomUUID(),
      carrier: randomItem(["UPS", "FedEx", "DHL"]),
      tracking: `1Z${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      shippedAt: addDays(new Date(), -randomInt(1, 30)),
      totalCost: randomInt(50, 200) // Total batch cost to be distributed
    });
  }

  console.log(`📦 Generated ${batches.length} shipping batches for finance testing.`);

  const newCases = [];

  for (let i = 0; i < CASES_TO_CREATE; i++) {
    const doctor = randomItem(doctors);
    const product = randomItem(PRODUCTS);
    const material = randomItem(MATERIALS[product]);
    const units = randomInt(1, 3);
    const isRush = Math.random() > 0.9;
    
    // Determine lifecycle state
    const rand = Math.random();
    let status, stage, shippedAt, shippingBatchId, shippingCost, carrier, tracking;

    if (rand < 0.2) {
      status = "IN_DESIGN";
      stage = "DESIGN";
    } else if (rand < 0.4) {
      status = "APPROVED";
      stage = "DESIGN";
    } else if (rand < 0.5) {
      status = "IN_MILLING";
      stage = "MILLING_GLAZING";
    } else {
      // SHIPPED / COMPLETED CASES
      status = rand < 0.8 ? "SHIPPED" : "COMPLETED";
      stage = status === "SHIPPED" ? "SHIPPING" : "COMPLETED";
      
      // Assign to a batch
      const batch = randomItem(batches);
      shippingBatchId = batch.id;
      carrier = batch.carrier;
      tracking = batch.tracking;
      shippedAt = batch.shippedAt;
      
      // Simple distribution: If a batch has 5 cases, each gets cost/5 roughly.
      // We'll just assign a static slice for simulation.
      shippingCost = batch.totalCost / randomInt(3, 8); 
    }

    // Base Cost Calculation (Rough approximation for DB)
    let unitPrice = 60;
    if (product === "EMAX") unitPrice = 110;
    if (doctor.clinic.priceTier === "IN_HOUSE") unitPrice -= 10;
    const caseCost = units * unitPrice;

    newCases.push({
      clinicId: doctor.clinicId,
      doctorUserId: doctor.id,
      salesRepId: (i % 3 === 0) ? salesRep?.id : null, // Assign sales rep to 1/3rd
      assigneeId: labUser?.id,
      
      patientAlias: `PAT-${1000 + i}`,
      patientFirstName: ["John", "Jane", "Alice", "Bob", "Charlie"][i % 5],
      patientLastName: `Doe-${i}`,
      doctorName: doctor.name,
      toothCodes: `${randomInt(1, 16)},${randomInt(17, 32)}`,
      
      orderDate: addDays(new Date(), -randomInt(5, 45)),
      dueDate: addDays(new Date(), randomInt(2, 10)),
      
      product,
      material,
      serviceLevel: doctor.clinic.priceTier === "IN_HOUSE" ? "IN_HOUSE" : "STANDARD",
      units,
      cost: caseCost,
      isRush,
      
      status,
      stage,
      
      // Finance / Shipping Data
      shippedAt,
      shippingCarrier: carrier,
      trackingNumber: tracking,
      shippingBatchId,
      shippingCost: shippingCost || 0
    });
  }

  // Insert in chunks
  await prisma.dentalCase.createMany({ data: newCases });

  console.log(`✅ Successfully injected ${newCases.length} cases.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });