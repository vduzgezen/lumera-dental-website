// portal/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validation: Ensure all fields from the new form are present
    if (
      !data.email || 
      !data.name || 
      !data.phone || 
      !data.street || 
      !data.city || 
      !data.state || 
      !data.zipCode
    ) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // Check if pending request exists
    const existingReq = await prisma.registrationRequest.findUnique({ where: { email: data.email } });
    if (existingReq) {
      return NextResponse.json({ error: "A request for this email is already pending." }, { status: 400 });
    }

    // Default clinic name since we removed it from the UI to streamline signup
    const clinicName = `${data.name}'s Practice`;

    await prisma.registrationRequest.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        clinicName: clinicName, // Auto-generated
        street: data.street,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        status: "PENDING"
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}