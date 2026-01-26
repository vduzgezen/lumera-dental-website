// portal/app/api/users/new/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { CreateUserSchema } from "@/lib/schemas"; 

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    
    // Manual Extraction for fields not in Zod schema yet (secondaryClinicIds)
    const secondaryIds = Array.isArray(body.secondaryClinicIds) ? body.secondaryClinicIds : [];

    // 1. Zod Validation
    const validation = CreateUserSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: `${firstError.path.join(".")}: ${firstError.message}` }, 
        { status: 400 }
      );
    }
    const data = validation.data;

    // 2. Check Uniqueness
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // 3. Clinic Resolution
    let resolvedClinicId: string | null = data.clinicId || null;
    if (!resolvedClinicId && data.newClinicName) {
      const createdClinic = await prisma.clinic.create({ data: { name: data.newClinicName } });
      resolvedClinicId = createdClinic.id;
    }

    // 4. Generate Credentials
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const pw = await bcrypt.hash(tempPassword, 10);

    // 5. Address Logic
    let addressConfig = undefined;
    const addr = data.address;
    if (addr?.id) {
        addressConfig = { connect: { id: addr.id } };
    } else if (addr?.street) {
        addressConfig = {
            create: {
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode
            }
        };
    }

    // 6. Create User
    const createData: Prisma.UserCreateInput = {
        email: data.email,
        password: pw,
        name: data.name,
        role: data.role,
        clinic: resolvedClinicId ? { connect: { id: resolvedClinicId } } : undefined,
        
        // ✅ NEW: Connect Secondary Clinics
        secondaryClinics: {
           connect: secondaryIds.map((id: string) => ({ id }))
        },

        phoneNumber: data.phoneNumber || null,
        preferenceNote: data.preferenceNote || null,
        address: addressConfig
    };

    const user = await prisma.user.create({
      data: createData,
      select: { id: true, email: true, name: true },
    });

    // 7. Send Email
    if (resend) {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                to: data.email,
                subject: "Welcome to Lumera Dental Portal",
                html: `
                    <div style="font-family: sans-serif; color: #111; padding: 20px;">
                        <h2 style="color: #1e1e1e;">Welcome to Lumera</h2>
                        <p>Hello ${data.name || "Doctor"},</p>
                        <p>Your account has been created.</p>
                        <p><strong>Login:</strong> ${data.email}</p>
                        <p><strong>Password:</strong> ${tempPassword}</p>
                        <p><a href="https://lumeradental.com/login">Log in here</a></p>
                    </div>
                `
            });
        } catch (err) {
            console.error("[Email] Failed to send credentials:", err);
        }
    }

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("Create user error:", e);
    return NextResponse.json({ error: "Internal error while creating user." }, { status: 500 });
  }
}