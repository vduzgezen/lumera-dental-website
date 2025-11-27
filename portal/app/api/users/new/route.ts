// app/api/users/new/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const clinicId = String(body.clinicId || "");
    const newClinicName = String(body.newClinicName || "").trim();

    if (!email || !password || (!clinicId && !newClinicName)) {
      return NextResponse.json(
        { error: "Please provide email, password, and either an existing clinic or a new clinic name." },
        { status: 400 }
      );
    }

    // ensure unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // resolve clinic
    let resolvedClinicId = clinicId;
    if (!resolvedClinicId) {
      const createdClinic = await prisma.clinic.create({ data: { name: newClinicName } });
      resolvedClinicId = createdClinic.id;
    } else {
      const ok = await prisma.clinic.findUnique({ where: { id: resolvedClinicId } });
      if (!ok) return NextResponse.json({ error: "Selected clinic not found." }, { status: 400 });
    }

    const pw = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: pw,
        name: name || null,
        role: "customer",
        clinicId: resolvedClinicId,
      },
      select: { id: true, email: true, name: true, clinicId: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("Create doctor error:", e);
    return NextResponse.json({ error: "Internal error while creating doctor." }, { status: 500 });
  }
}
