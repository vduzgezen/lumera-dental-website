// portal/app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client"; // ✅ Changed from 'type { Prisma }' to '{ Prisma }' to access Prisma.Decimal
import type { CaseStatus, ProductionStage } from "@/lib/types";
import { calculateProductionCosts } from "@/lib/cost-engine";

function stageForStatus(to: CaseStatus): ProductionStage {
  switch (to) {
    case "IN_MILLING":
      return "MILLING_GLAZING";
    case "SHIPPED":
      return "SHIPPING";
    case "COMPLETED":
      return "COMPLETED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED": 
      return "DESIGN"; 
    case "APPROVED":
    default:
      return "DESIGN";
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const to = body?.to as CaseStatus | undefined;
  const note: string | undefined = body?.note;
  const waiveFee: boolean = body?.waiveFee === true; 

  if (!to) return NextResponse.json({ error: "Missing 'to' status" }, { status: 400 });

  const item = await prisma.dentalCase.findUnique({ 
    where: { id },
    include: { files: true }
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ DOCTOR PERMISSIONS
  if (session.role === "customer") {
    const allowedForDoctor: CaseStatus[] = ["APPROVED", "CHANGES_REQUESTED", "DELIVERED", "CANCELLED"];
    if (!allowedForDoctor.includes(to)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Ownership Check
    const isOwner = item.doctorUserId === session.userId;
    const isSameClinic = session.clinicId && item.clinicId === session.clinicId;
    if (!isOwner && !isSameClinic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (to === "DELIVERED" && item.status !== "COMPLETED") {
        return NextResponse.json({ error: "Case must be marked Completed (Arrived at Clinic) before marking Delivered." }, { status: 400 });
    }
  }

  // Guard logic for APPROVED
  if (to === "APPROVED") {
    if (["APPROVED", "IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED", "CANCELLED"].includes(item.status)) {
      return NextResponse.json({ error: "Case is already approved/processed." }, { status: 400 });
    }
    const labels = new Set(item.files.map((f) => f.label));
    const missing: string[] = [];
    if (!labels.has("construction_info")) missing.push("Construction Info");
    if (!labels.has("model_top")) missing.push("Model Top");
    if (!labels.has("model_bottom")) missing.push("Model Bottom");
    
    if (missing.length > 0) {
       return NextResponse.json({ 
         error: `Cannot Approve Design. Missing files: ${missing.join(", ")}` 
       }, { status: 400 });
    }
  }

  const newStage = stageForStatus(to);
  const at = new Date();

  // ✅ CANCELLATION FEE LOGIC
  let finalCost = item.cost; // Inferred as Prisma.Decimal

  if (to === "CANCELLED") {
    // 1. Can only waive fee if Admin or Lab
    const canWaive = (session.role === "admin" || session.role === "lab") && waiveFee;

    if (canWaive) {
       finalCost = new Prisma.Decimal(0); // ✅ Wrapped in Prisma.Decimal
    } else {
       // 2. Calculate dynamic fee based on state
       const hasDesignFiles = item.files.some((f: any) => String(f.label).startsWith("design_stl_") || String(f.label) === "design_only");
       const isProduced = ["MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"].includes(item.stage) || ["IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED"].includes(item.status);
       
       const costs = calculateProductionCosts(item.product, item.material, item.units, !!item.salesRepId);

       if (isProduced) {
          // ✅ UPDATED: Generic terminology - If produced, they pay the actual cost incurred (Milling + Design)
          finalCost = new Prisma.Decimal(costs.milling + costs.design); // ✅ Wrapped
       } else if (hasDesignFiles) {
          // If just designed, they pay the design fee 
          finalCost = new Prisma.Decimal(costs.design); // ✅ Wrapped
       } else {
          // Cancelled before any work was done
          finalCost = new Prisma.Decimal(0); // ✅ Wrapped
       }
    }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.dentalCase.update({
      where: { id },
      data: {
        status: to,
        stage: to === "CANCELLED" ? item.stage : newStage,
        designedAt: to === "READY_FOR_REVIEW" ? at : item.designedAt,
        milledAt: to === "IN_MILLING" ? at : item.milledAt,
        shippedAt: to === "SHIPPED" ? at : item.shippedAt,
        cost: finalCost, // ✅ Successfully passes back the Decimal
      },
    });

    await tx.statusEvent.create({
      data: {
        caseId: id,
        from: item.status,
        to,
        note: note ?? null,
        actorId: session.userId ?? undefined,
      },
    });
  });

  return NextResponse.json({ ok: true, status: to, stage: newStage, at });
}
