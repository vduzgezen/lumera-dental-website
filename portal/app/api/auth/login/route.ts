import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "@node-rs/argon2";
import jwt from "jsonwebtoken";

const COOKIE = "lumera_session";
const SECRET = process.env.JWT_SECRET!;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verify(user.password, password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, clinicId: user.clinicId ?? undefined },
    SECRET,
    { expiresIn: "7d" }
  );

  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: isProd,     // ✅ only secure in production
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
