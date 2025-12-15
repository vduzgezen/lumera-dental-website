// portal/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = /^\/portal(\/|$)/;

export function middleware(req: NextRequest) {
  // Only guard /portal/*
  if (!PROTECTED.test(req.nextUrl.pathname)) return NextResponse.next();

  // Edge runtime: don't verify here, just require the cookie to exist.
  // (Verification happens server-side in your pages via getSession().)
  const has = req.cookies.has("lumera_session");
  if (!has) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
