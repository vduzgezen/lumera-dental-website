//portal/app/api/clinics/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const addr = data.address || {};
  let addressConfig = undefined;
  
  if (addr.id) {
    addressConfig = { connect: { id: addr.id } };
  } else if (addr.street) {
    addressConfig = {
      create: {
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode
      }
    };
  }

  const clinic = await prisma.clinic.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      billingCycleDay: Number(data.billingCycleDay) || 1,
      paymentTerms: Number(data.paymentTerms) || 30,
      priceTier: data.priceTier || "STANDARD",
      taxId: data.taxId,
      bankName: data.bankName,
      routingNumber: data.routingNumber,
      bankLast4: data.bankLast4,
      address: addressConfig
    }
  });
  return NextResponse.json(clinic);
}

// NEW: Delete Clinic
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.clinic.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Cannot delete clinic. It likely has users or cases linked." }, { status: 500 });
  }
}