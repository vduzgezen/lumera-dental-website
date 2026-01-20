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

// Initialize Resend
// Checks for key to prevent crashes if env is missing during dev
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const clinicId = String(body.clinicId || "");
    const newClinicName = String(body.newClinicName || "").trim();
    const phoneNumber = String(body.phoneNumber || "").trim();
    const preferenceNote = String(body.preferenceNote || "").trim();
    const role = body.role || "customer";

    // Address Payload
    const addr = body.address || {};
    const hasAddress = addr.street || addr.city || addr.state || addr.zipCode;

    if (!email) {
      return NextResponse.json({ error: "Please provide an email." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // Clinic Resolution
    let resolvedClinicId: string | null = clinicId || null;
    if (!resolvedClinicId && newClinicName) {
      const createdClinic = await prisma.clinic.create({ data: { name: newClinicName } });
      resolvedClinicId = createdClinic.id;
    }

    // --- 1. GENERATE CREDENTIALS ---
    // Generate a human-friendly temp password (12 chars hex)
    const tempPassword = crypto.randomBytes(6).toString("hex"); 
    const pw = await bcrypt.hash(tempPassword, 10);

    // Prepare Address Connect or Create
    let addressConfig = undefined;
    if (addr.id) {
        addressConfig = { connect: { id: addr.id } };
    } else if (hasAddress) {
        addressConfig = {
            create: {
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode
            }
        };
    }

    // --- 2. CREATE USER ---
    // Using explicit type to satisfy Prisma TS Check
    const createData: Prisma.UserCreateInput = {
        email,
        password: pw,
        name: name || null,
        role,
        clinic: resolvedClinicId ? { connect: { id: resolvedClinicId } } : undefined,
        phoneNumber: phoneNumber || null,
        preferenceNote: preferenceNote || null,
        // @ts-ignore: Dynamic relation handling
        address: addressConfig
    };

    const user = await prisma.user.create({
      data: createData,
      select: { id: true, email: true, name: true },
    });

    // --- 3. SEND EMAIL ---
    if (resend) {
        try {
            const sender = process.env.EMAIL_FROM || "onboarding@resend.dev";
            
            await resend.emails.send({
                from: sender,
                to: email,
                subject: "Welcome to Lumera Dental Portal",
                html: `
                    <div style="font-family: sans-serif; color: #111; max-width: 600px; padding: 20px;">
                        <h2 style="color: #0a1020;">Welcome to Lumera</h2>
                        <p>Hello ${name || "Doctor"},</p>
                        <p>Your account has been created. You can now log in to submit and track your cases.</p>
                        
                        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e4e4e7;">
                            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Login Email</p>
                            <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 16px;">${email}</p>
                            
                            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</p>
                            <p style="margin: 5px 0 0 0; font-weight: bold; font-family: monospace; font-size: 18px; color: #000;">${tempPassword}</p>
                        </div>

                        <p>Please log in and change your password as soon as possible.</p>
                        <a href="https://lumeradental.com/login" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Log in to Portal</a>
                        
                        <p style="margin-top: 30px; font-size: 12px; color: #888;">
                            If you did not request this account, please ignore this email.
                        </p>
                    </div>
                `
            });
            console.log(`[Email] Sent credentials to ${email}`);
        } catch (err) {
            console.error("[Email] Failed to send credentials:", err);
            // We do NOT fail the request, because the user was created successfully.
        }
    } else {
        console.warn("[Email] Skipped sending (No RESEND_API_KEY found)");
    }

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("Create user error:", e);
    return NextResponse.json({ error: "Internal error while creating user." }, { status: 500 });
  }
}