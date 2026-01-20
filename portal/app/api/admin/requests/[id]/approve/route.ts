// portal/app/api/admin/requests/[id]/approve/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Resend } from "resend";
import crypto from "node:crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    const request = await prisma.registrationRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.registrationRequest.update({ 
        where: { id }, 
        data: { status: "REJECTED" } 
      });
      return NextResponse.json({ ok: true });
    }

    // --- APPROVE ---
    const existingUser = await prisma.user.findUnique({ where: { email: request.email } });
    if (existingUser) {
        await prisma.registrationRequest.update({ 
            where: { id }, 
            data: { status: "PROCESSED" } 
        });
        return NextResponse.json({ ok: true, warning: "User already existed." });
    }

    // 1. Create Address (Linked to USER later, not Clinic)
    const address = await prisma.address.create({
      data: {
        street: request.street,
        city: request.city,
        state: request.state,
        zipCode: request.zipCode,
      }
    });

    // 2. Create Clinic (Name ONLY - No Address)
    // "I dont want the address the new user enters to be a clinic"
    // We assume the user creates a new clinic entity, but keeps their personal address on their user profile.
    const clinic = await prisma.clinic.create({
      data: {
        name: request.clinicName
      }
    });

    // 3. Create User (Linked to Clinic AND Address)
    const token = crypto.randomBytes(16).toString("hex");
    await prisma.user.create({
      data: {
        email: request.email,
        name: request.name,
        phoneNumber: request.phone,
        role: "customer",
        clinicId: clinic.id,
        addressId: address.id, // <--- Address linked here
        password: "PENDING_SETUP", 
        invitationToken: token,
      }
    });

    await prisma.registrationRequest.update({ 
        where: { id }, 
        data: { status: "PROCESSED" } 
    });

    if (resend) {
      try {
        const sender = process.env.EMAIL_FROM || "onboarding@resend.dev";
        const baseUrl = process.env.NEXT_PUBLIC_URL || "https://lumeradental.com";
        const setupUrl = `${baseUrl}/setup?token=${token}`;

        await resend.emails.send({
          from: sender,
          to: request.email,
          subject: "Your Lumera Account is Approved",
          html: `
            <div style="font-family: sans-serif; color: #111; max-width: 600px; padding: 20px;">
              <h2 style="color: #0a1020;">Access Granted</h2>
              <p>Hello ${request.name},</p>
              <p>Your request to join the Lumera Dental Portal has been approved.</p>
              <a href="${setupUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Set Password</a>
            </div>
          `
        });
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("Approval error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}