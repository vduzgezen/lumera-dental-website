import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // We can remove the manual regex check because the matcher handles it
  const has = req.cookies.has("lumera_session");
  
  if (!has) {
    // Redirect to login if trying to access portal without session
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// ✅ PERFORMANCE: Only run on /portal routes
export const config = {
  matcher: "/portal/:path*",
};