// portal/lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type Session = {
  userId: string;
  role: "customer" | "lab" | "admin" | "milling";
  clinicId?: string;
  millingCenterId?: string; // ✅ NEW: For lab user scoping
  iat?: number;
  exp?: number;
};

const COOKIE_NAME = "lumera_session";

// 1. SECURE SECRET HANDLING
// In production, fail hard if the secret is missing to prevent insecure deployments.
const SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !SECRET) {
  throw new Error("FATAL: JWT_SECRET is not defined.");
}
const FINAL_SECRET = SECRET || "dev-secret";

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

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, FINAL_SECRET) as Session;
  } catch {
    return null;
  }
}

// Helper to sign tokens consistently
export function signToken(payload: object) {
  return jwt.sign(payload, FINAL_SECRET, { 
    // ✅ FIX: Cast to 'any' to resolve the "Type 'string' is not assignable" error.
    // The library expects a specific 'StringValue' type, but 'string' works fine at runtime.
    expiresIn: COOKIE_OPTIONS.duration as any 
  });
}
