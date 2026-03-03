// portal/lib/auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Session = {
  userId: string;
  role: "customer" | "lab" | "admin" | "milling";
  clinicId?: string;
  millingCenterId?: string;
  iat?: number;
  exp?: number;
};

const COOKIE_NAME = "lumera_session";

// 1. SECURE SECRET HANDLING (No Fallbacks)
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing.");
}
// Jose requires a Uint8Array secret
const secretKey = new TextEncoder().encode(SECRET);

// 2. CENTRALIZED COOKIE CONFIG
export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  duration: "24h", // Reduced from 7d to 24h for security
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production", // ✅ Auto-enable HTTPS in prod
    path: "/",
    maxAge: 60 * 60 * 24, // 1 Day (seconds)
  },
};

// Helper to sign tokens consistently on Edge or Node
export async function signToken(payload: object) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(COOKIE_OPTIONS.duration)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as Session;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return await verifyToken(token);
}