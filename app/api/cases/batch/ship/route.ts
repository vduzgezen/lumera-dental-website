// portal/app/api/cases/batch/ship/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "milling" && session.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, tracking, carrier, shippingCost } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No cases selected" }, { status: 400 });
    }

    if (!tracking) {
        return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });
    }

    // ✅ Generate a unique Batch ID for finance tracking
    const batchId = crypto.randomUUID();
    // ✅ Distribute the total shipping cost across selected cases
    const distributedCost = shippingCost ? (Number(shippingCost) / ids.length) : 0;

    await prisma.dentalCase.updateMany({
        where: { id: { in: ids } },
        data: {
            status: "SHIPPED",
            stage: "SHIPPING",
            shippedAt: new Date(),
            trackingNumber: tracking,
            shippingCarrier: carrier || "UPS",
            shippingCost: distributedCost,
            shippingBatchId: batchId
        }
    });

    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error("Batch ship error:", e);
    return NextResponse.json({ error: "Failed to update shipping status" }, { status: 500 });
  }
}