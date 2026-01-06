// app/api/users/new/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    // No password from body. We generate a random one.
    const clinicId = String(body.clinicId || "");
    const newClinicName = String(body.newClinicName || "").trim();
    const phoneNumber = String(body.phoneNumber || "").trim();
    const preferenceNote = String(body.preferenceNote || "").trim();
    const role = body.role || "customer";

    if (!email) {
      return NextResponse.json(
        { error: "Please provide an email." },
        { status: 400 }
      );
    }

    // ensure unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // resolve clinic
    let resolvedClinicId: string | null = clinicId || null;
    if (!resolvedClinicId && newClinicName) {
      const createdClinic = await prisma.clinic.create({ data: { name: newClinicName } });
      resolvedClinicId = createdClinic.id;
    } else if (resolvedClinicId) {
      const ok = await prisma.clinic.findUnique({ where: { id: resolvedClinicId } });
      if (!ok) return NextResponse.json({ error: "Selected clinic not found." }, { status: 400 });
    }

    // Generate a secure random password since the user will set it via email flow later.
    // For now, this effectively locks the account until a reset flow exists, or admin acts.
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const pw = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: pw,
        name: name || null,
        role,
        clinicId: resolvedClinicId,
        phoneNumber: phoneNumber || null,
        preferenceNote: preferenceNote || null,
      },
      select: { id: true, email: true, name: true, clinicId: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("Create user error:", e);
    return NextResponse.json({ error: "Internal error while creating user." }, { status: 500 });
  }
}