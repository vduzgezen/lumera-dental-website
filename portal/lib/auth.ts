import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type Session = {
  userId: string;
  role: "customer" | "lab" | "admin";
  clinicId?: string;
};

const COOKIE = "lumera_session";
const SECRET = process.env.JWT_SECRET!;

/**
 * Read & verify the session JWT from the request cookies.
 * Next.js 15: cookies() can be async, so we await it.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies(); // async in Next 15
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as Session;
  } catch {
    return null;
  }
}
