// portal/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("lumera_session")?.value;
  const url = req.nextUrl.clone();
  url.pathname = "/login";

  // If there's no cookie at all, bounce them
  if (!token) {
    return NextResponse.redirect(url);
  }

  try {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) throw new Error("Missing Secret");
    
    const secretKey = new TextEncoder().encode(SECRET);
    
    // Mathematically verify the token on the Edge before letting them hit the page
    await jwtVerify(token, secretKey);
    
    return NextResponse.next();
  } catch (error) {
    // Token is fake, expired, or tampered with
    const response = NextResponse.redirect(url);
    response.cookies.delete("lumera_session");
    return response;
  }
}

// ✅ PERFORMANCE: Only run on /portal routes
export const config = {
  matcher: "/portal/:path*",
};