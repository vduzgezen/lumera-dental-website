//portal/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// Removed bcrypt import as we are not updating password here anymore

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const data = await req.json();

  // Prepare update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    // If they picked a new clinic, link it. If empty string, unlink it (null).
    clinicId: data.clinicId || null,
    phoneNumber: data.phoneNumber || null,
    preferenceNote: data.preferenceNote || null,
  };

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });
  return NextResponse.json(user);
}