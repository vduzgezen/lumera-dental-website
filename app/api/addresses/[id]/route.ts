// portal/app/api/addresses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  const { id } = params;

  try {
    // 1. Unlink from Users (Wipe address data from user profiles)
    await prisma.user.updateMany({
      where: { addressId: id },
      data: { addressId: null }
    });

    // 2. Unlink from Clinics (Wipe address data from clinic profiles)
    await prisma.clinic.updateMany({
      where: { addressId: id },
      data: { addressId: null }
    });

    // 3. Delete the Address Record
    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Address delete error:", e);
    return NextResponse.json({ error: "Failed to delete address." }, { status: 500 });
  }
}