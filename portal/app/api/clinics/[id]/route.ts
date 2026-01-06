//portal/app/api/clinics/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const clinic = await prisma.clinic.update({
    where: { id },
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