// portal/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to add connection limit params if missing
const getUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  
  // Limit to 10 connections (Standard for Serverless/Neon in Dev)
  if (!url.includes("connection_limit")) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}connection_limit=10`;
  }
  
  // ✅ UPDATE: Increase timeout to 60s (handles Neon "Cold Starts")
  if (!url.includes("pool_timeout")) {
    url += "&pool_timeout=60";
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