// portal/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // ✅ Next.js 15 way
import { COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  
  // ✅ Force delete by setting maxAge to 0 with matching options
  jar.set({
    name: COOKIE_OPTIONS.name,
    value: "",
    ...COOKIE_OPTIONS.options,
    maxAge: 0,
  });
  
  return NextResponse.json({ ok: true });
}