// portal/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to add connection parameters for resilience
const getUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  
  const hasParams = url.includes("?");
  const separator = hasParams ? "&" : "?";

  // 1. Connection Limit: Serverless environments need lower limits per instance
  if (!url.includes("connection_limit")) {
    url += `${separator}connection_limit=10`;
  }
  
  // 2. ✅ CRITICAL FIX: Increase Pool Timeout
  // Default is 10s. Neon cold starts can take 3-10s. 
  // We set it to 60s to ensure we wait for the wake-up without crashing.
  if (!url.includes("pool_timeout")) {
    url += `&pool_timeout=60`;
  }

  // 3. Connect Timeout (Socket timeout)
  if (!url.includes("connect_timeout")) {
    url += `&connect_timeout=60`;
  }
  
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}