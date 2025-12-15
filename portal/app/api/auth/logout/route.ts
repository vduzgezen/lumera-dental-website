import { NextResponse } from "next/server";

const COOKIE = "lumera_session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);   // deletion works regardless of secure flag
  return res;
}
