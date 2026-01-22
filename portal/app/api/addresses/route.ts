// portal/app/api/addresses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  try {
    const where: Prisma.AddressWhereInput = {};
    
    if (q.trim()) {
      where.OR = [
        { street: { contains: q.trim() } },
        { city: { contains: q.trim() } },
        { state: { contains: q.trim() } },
        { zipCode: { contains: q.trim() } },
      ];
    }

    const addresses = await prisma.address.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch addresses." }, { status: 500 });
  }
}