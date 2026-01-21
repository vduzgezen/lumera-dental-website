// app/api/cases/batch/ship/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "milling" && session.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, tracking, carrier } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No cases selected" }, { status: 400 });
    }

    await prisma.dentalCase.updateMany({
        where: { id: { in: ids } },
        data: {
            status: "SHIPPED",
            stage: "SHIPPING",
            shippedAt: new Date(),
            trackingNumber: tracking,
            shippingCarrier: carrier
        }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Batch ship error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}