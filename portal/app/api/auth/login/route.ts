// portal/app/api/auth/login/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_OPTIONS } from "@/lib/auth"; // ✅ Import rules

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Generate Token
    const token = signToken({
      userId: user.id,
      role: user.role,
      clinicId: user.clinicId ?? null,
    });

    // ✅ Set Secure Cookie
    const jar = await cookies();
    jar.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS.options);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Login Error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}