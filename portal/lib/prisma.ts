// portal/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to add connection limit params if missing
const getUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  
  // If it doesn't already have a connection_limit, add one.
  // Limit to 10 connections to prevent exhausting the Neon pool in serverless/dev
  if (!url.includes("connection_limit")) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}connection_limit=10`;
  }
  
  // Set pool timeout to 20 seconds (give it more time to connect before crashing)
  if (!url.includes("pool_timeout")) {
    url += "&pool_timeout=20";
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