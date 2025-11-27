// app/api/auth/login/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: String(email || "").toLowerCase() } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // NOTE: bcryptjs compare
    const ok = await bcrypt.compare(String(password || ""), user.password);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        clinicId: user.clinicId ?? null,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    (await cookies()).set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: true, // enable in prod
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
