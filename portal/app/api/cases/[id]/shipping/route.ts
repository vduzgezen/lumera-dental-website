// portal/app/api/cases/[id]/shipping/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <--- FIXED TYPE
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params; // <--- AWAIT PARAMS
    const json = await request.json();
    const { carrier, tracking, eta } = json;

    const updatedCase = await prisma.dentalCase.update({
      where: { id },
      data: {
        shippingCarrier: carrier,
        trackingNumber: tracking,
        shippingEta: eta ? new Date(eta) : null,
        shippedAt: new Date(), // Auto-set shipped timestamp
        status: "SHIPPED",     // Auto-update status
        stage: "SHIPPING"      // Auto-update stage
      },
    });

    return NextResponse.json({ 
      ok: true, 
      shipping: { 
        carrier: updatedCase.shippingCarrier, 
        tracking: updatedCase.trackingNumber, 
        eta: updatedCase.shippingEta 
      } 
    });
  } catch (error) {
    console.error("Shipping update error:", error);
    return NextResponse.json({ error: "Failed to update shipping" }, { status: 500 });
  }
}