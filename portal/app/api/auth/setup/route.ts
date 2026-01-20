// portal/app/api/auth/setup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Find user with this token
    const user = await prisma.user.findUnique({ where: { invitationToken: token } });
    if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);

    // Update user: Set password, clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        invitationToken: null // One-time use
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}