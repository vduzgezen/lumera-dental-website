//portal/app/api/users/[id]/route.ts
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

  let clinicConfig = undefined;
  if (data.clinicId) {
    clinicConfig = { connect: { id: data.clinicId } };
  } else if (data.clinicId === null || data.clinicId === "") {
    clinicConfig = { disconnect: true };
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    clinic: clinicConfig,
    phoneNumber: data.phoneNumber || null,
    preferenceNote: data.preferenceNote || null,
    address: addressConfig
  };

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });

  return NextResponse.json(user);
}

// NEW: Delete User
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Delete user (cascade logic depends on schema, but usually safe for users unless they own critical records)
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to delete user. They may have active cases." }, { status: 500 });
  }
}