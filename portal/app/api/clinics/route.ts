//portal/app/api/clinics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const clinics = await prisma.clinic.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(clinics);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  // Basic validation
  if (!data.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      street: data.street,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      billingCycleDay: Number(data.billingCycleDay) || 1,
      paymentTerms: Number(data.paymentTerms) || 30,
      priceTier: data.priceTier || "STANDARD",
      taxId: data.taxId,
      bankName: data.bankName,
      routingNumber: data.routingNumber,
      bankLast4: data.bankLast4,
    }
  });
  return NextResponse.json(clinic);
}