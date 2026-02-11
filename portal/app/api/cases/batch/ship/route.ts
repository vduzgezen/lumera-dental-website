// FILE: app/api/cases/batch/ship/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "milling" && session.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Receive shippingCost
    const { ids, tracking, carrier, shippingCost } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No cases selected" }, { status: 400 });
    }

    if (!tracking) {
        return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });
    }

    // Update all selected cases
    await prisma.dentalCase.updateMany({
        where: { id: { in: ids } },
        data: {
            status: "SHIPPED",
            stage: "SHIPPING",
            shippedAt: new Date(),
            trackingNumber: tracking,
            shippingCarrier: carrier || "UPS"
            // Note: shippingCost is not stored in DB yet as schema update is required.
            // Future: Add 'shippingCost' field to DentalCase model.
        }
    });

    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error("Batch ship error:", e);
    return NextResponse.json({ error: "Failed to update shipping status" }, { status: 500 });
  }
}