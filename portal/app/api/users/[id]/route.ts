// portal/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const params = await props.params;
  const { id } = params;
  const data = await req.json();

  // Address Logic
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

  // Primary Clinic Logic
  let clinicConfig = undefined;
  if (data.clinicId) {
    clinicConfig = { connect: { id: data.clinicId } };
  } else if (data.clinicId === null || data.clinicId === "") {
    clinicConfig = { disconnect: true };
  }

  // Secondary Clinics Logic
  const secondaryIds = Array.isArray(data.secondaryClinicIds) ? data.secondaryClinicIds : [];
  const secondaryConfig = {
     set: secondaryIds.map((cid: string) => ({ id: cid }))
  };

  // ✅ FIXED: Sales Rep Logic using Relation Syntax
  // We cannot set 'salesRepId' directly. We must use connect/disconnect.
  let salesRepConfig = undefined;
  if (data.salesRepId) {
    // If an ID is provided, Connect it
    salesRepConfig = { connect: { id: data.salesRepId } };
  } else {
    // If ID is empty/null, Disconnect it
    salesRepConfig = { disconnect: true };
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    clinic: clinicConfig,
    secondaryClinics: secondaryConfig,
    salesRep: salesRepConfig, // ✅ Use the relation object
    phoneNumber: data.phoneNumber || null,
    preferenceNote: data.preferenceNote || null,
    address: addressConfig
  };

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(user);
  } catch (e: any) {
    console.error("Update User Error:", e);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const params = await props.params;
  const { id } = params;

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to delete user. They may have active cases." }, { status: 500 });
  }
}