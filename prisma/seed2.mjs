import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  console.log('🧹 Wiping existing data...')
  await prisma.caseFile.deleteMany()
  await prisma.statusEvent.deleteMany()
  await prisma.caseComment.deleteMany()
  await prisma.dentalCase.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinic.deleteMany()
  await prisma.address.deleteMany()

  const defaultPassword = await bcrypt.hash("password123", 10)

  const clinicAddress = await prisma.address.create({
    data: {
      street: "123 Smile Boulevard",
      city: "Boston",
      state: "MA",
      zipCode: "02110",
      country: "USA"
    }
  })

  const clinic = await prisma.clinic.create({
    data: {
      name: "Premier Dental Solutions",
      addressId: clinicAddress.id,
      phone: "555-0199",
      billingCycleDay: 1,
      paymentTerms: 30,
      priceTier: "STANDARD"
    }
  })

  console.log('👥 Creating core team users...')
  
  const admin = await prisma.user.create({
    data: { email: "admin@lumera.com", password: defaultPassword, name: "Admin Boss", role: "admin" }
  })

  const labTech = await prisma.user.create({
    data: { email: "lab@lumera.com", password: defaultPassword, name: "Sarah Designer", role: "lab" }
  })

  const millingTech = await prisma.user.create({
    data: { email: "milling@lumera.com", password: defaultPassword, name: "Mike Miller", role: "milling" }
  })

  const salesRep = await prisma.user.create({
    data: { email: "sales@lumera.com", password: defaultPassword, name: "Sam Sales", role: "sales" }
  })

  const doctor = await prisma.user.create({
    data: { 
      email: "doctor@premier.com", 
      password: defaultPassword, 
      name: "Dr. Jane Smith", 
      role: "customer",
      clinicId: clinic.id,
      salesRepId: salesRep.id,
      phoneNumber: "555-123-4567"
    }
  })

  console.log('🦷 Generating Dental Cases across all statuses...')

  const baseCaseData = {
    clinicId: clinic.id,
    doctorUserId: doctor.id,
    salesRepId: salesRep.id,
    assigneeId: labTech.id,
    doctorName: "Dr. Jane Smith",
    billingType: "BILLABLE",
    currency: "USD",
  }

  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "JD-001",
      patientFirstName: "John",
      patientLastName: "Doe",
      toothCodes: "8, 9",
      product: "CROWN",
      material: "ZIRCONIA_HT",
      units: 2,
      status: "IN_DESIGN",
      stage: "DESIGN"
    }
  })

  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "AS-002",
      patientFirstName: "Alice",
      patientLastName: "Smith",
      toothCodes: "14",
      product: "INLAY_ONLAY",
      material: "E_MAX",
      units: 1,
      status: "READY_FOR_REVIEW",
      stage: "DESIGN",
      needsReview: true,
      reviewQuestion: "Please verify the margin on the mesial edge."
    }
  })

  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "BW-003",
      patientFirstName: "Bob",
      patientLastName: "White",
      toothCodes: "3",
      product: "CROWN",
      material: "ZIRCONIA_HT",
      units: 1,
      status: "CHANGES_REQUESTED",
      stage: "DESIGN"
    }
  })

  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "CJ-004",
      patientFirstName: "Charlie",
      patientLastName: "Johnson",
      toothCodes: "18, 19, 20",
      product: "BRIDGE",
      material: "ZIRCONIA_MULTILAYER",
      units: 3,
      isBridge: true,
      status: "IN_MILLING",
      stage: "MILLING_GLAZING",
      designedAt: new Date()
    }
  })

  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "DEAD-005",
      patientFirstName: "Ghost",
      patientLastName: "Patient",
      toothCodes: "1",
      product: "CROWN",
      material: "ZIRCONIA_HT",
      units: 1,
      status: "CANCELLED",
      stage: "DESIGN"
    }
  })

  console.log('📦 Generating shipped batches for Finance Dashboard...')
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const batch1Id = "BATCH-UPS-98765"
  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "FIN-001",
      patientLastName: "Finance1",
      toothCodes: "4",
      product: "CROWN",
      material: "ZIRCONIA_HT",
      units: 1,
      status: "SHIPPED",
      stage: "SHIPPING",
      shippingBatchId: batch1Id,
      shippedAt: yesterday,
      shippingCarrier: "UPS",
      trackingNumber: "1Z9999999999999991",
      shippingCost: 12.50
    }
  })
  
  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "FIN-002",
      patientLastName: "Finance2",
      toothCodes: "5",
      product: "CROWN",
      material: "ZIRCONIA_HT",
      units: 1,
      status: "SHIPPED",
      stage: "SHIPPING",
      shippingBatchId: batch1Id,
      shippedAt: yesterday,
      shippingCarrier: "UPS",
      trackingNumber: "1Z9999999999999991"
    }
  })

  const batch2Id = "BATCH-FEDEX-12345"
  await prisma.dentalCase.create({
    data: {
      ...baseCaseData,
      patientAlias: "FIN-003",
      patientLastName: "Finance3",
      toothCodes: "7, 8, 9, 10",
      product: "VENEER",
      material: "E_MAX",
      units: 4,
      status: "DELIVERED",
      stage: "DELIVERED",
      shippingBatchId: batch2Id,
      shippedAt: lastWeek,
      shippingCarrier: "FedEx",
      trackingNumber: "777777777777",
      shippingCost: 25.00
    }
  })

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })