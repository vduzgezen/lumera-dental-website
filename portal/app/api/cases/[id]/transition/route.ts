// portal/app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import type { CaseStatus, ProductionStage } from "@/lib/types";
import { calculateProductionCosts } from "@/lib/cost-engine";

function stageForStatus(to: CaseStatus | string): ProductionStage {
  switch (to) {
    case "IN_MILLING": return "MILLING_GLAZING";
    case "SHIPPED": return "SHIPPING";
    case "COMPLETED": return "COMPLETED";
    case "DELIVERED": return "DELIVERED";
    case "READY_FOR_REVIEW": return "DESIGN";
    case "CHANGES_REQUESTED": return "DESIGN";
    case "CHANGES_REQUESTED_FROM_DOCTOR": return "DESIGN";
    case "CANCELLED": return "DESIGN";
    case "APPROVED":
    default: return "DESIGN";
  }
}

// ✅ DYNAMIC FILE CHECKER
function getRequiredFiles(productType: string, isBridge: boolean, teethArray: string[]): string[] {
    const required = [];
    
    // Future expansion: if (productType === "NIGHTGUARD") return ["design_only"]
    // For now, assume Crowns/Bridges standard rules apply
    
    required.push("construction_info");
    required.push("model_top");
    required.push("model_bottom");

    // We don't strictly require tooth STLs here because the 'hasAllDesigns' flag on the frontend 
    // already validates tooth/bridge geometry before unlocking the button.
    // This server-side check ensures the bare-minimum manufacturing files exist.
    return required;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  let to = body?.to as string | undefined;
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
    const allowedForDoctor = ["APPROVED", "CHANGES_REQUESTED", "DELIVERED", "CANCELLED"];
    if (!allowedForDoctor.includes(to)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const isOwner = item.doctorUserId === session.userId;
    const isSameClinic = session.clinicId && item.clinicId === session.clinicId;
    if (!isOwner && !isSameClinic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (to === "DELIVERED" && item.status !== "COMPLETED") {
        return NextResponse.json({ error: "Case must be marked Completed before marking Delivered." }, { status: 400 });
    }
  }

  // Guard logic for APPROVED
  if (to === "APPROVED") {
    if (["APPROVED", "IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED", "CANCELLED"].includes(item.status)) {
      return NextResponse.json({ error: "Case is already approved/processed." }, { status: 400 });
    }
    
    const labels = new Set(item.files.map((f) => String(f.label).toLowerCase()));
    const teeth = item.toothCodes.split(",").map(t => t.trim()).filter(Boolean);
    const requiredFiles = getRequiredFiles(item.product, item.isBridge, teeth);
    
    const missing = requiredFiles.filter(req => !labels.has(req));
    
    if (missing.length > 0) {
       return NextResponse.json({ error: `Cannot Approve. Missing manufacturing files: ${missing.join(", ")}` }, { status: 400 });
    }
  }

  // ✅ MAP "REQUEST CHANGES FROM DOCTOR" back to standard status for DB
  if (to === "CHANGES_REQUESTED_FROM_DOCTOR") {
      to = "CHANGES_REQUESTED"; 
  }

  const newStage = stageForStatus(to);
  const at = new Date();

  // ✅ CANCELLATION FEE LOGIC
  let finalCost = item.cost;
  if (to === "CANCELLED") {
    const canWaive = (session.role === "admin" || session.role === "lab") && waiveFee;
    if (canWaive) {
       finalCost = new Prisma.Decimal(0);
    } else {
       const hasDesignFiles = item.files.some((f: any) => String(f.label).startsWith("design_stl_") || String(f.label) === "design_only");
       const isProduced = ["MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"].includes(item.stage) || ["IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED"].includes(item.status);
       
       const costs = calculateProductionCosts(item.product, item.material, item.units, !!item.salesRepId);
       if (isProduced) {
          finalCost = new Prisma.Decimal(costs.milling + costs.design);
       } else if (hasDesignFiles) {
          finalCost = new Prisma.Decimal(costs.design);
       } else {
          finalCost = new Prisma.Decimal(0);
       }
    }
  }

  // ✅ NEW: Smart Action Routing
  let newActionRequiredBy = item.actionRequiredBy;
  
  if (to === "READY_FOR_REVIEW") {
      // Lab clicked "Send to Doctor"
      newActionRequiredBy = "DOCTOR";
  } else if (to === "CHANGES_REQUESTED" && session.role !== "customer") {
      // Lab clicked "Request New Scan"
      newActionRequiredBy = "DOCTOR";
  } else if (to === "CHANGES_REQUESTED" && session.role === "customer") {
      // Doctor clicked "Request Changes"
      newActionRequiredBy = "LAB";
  } else if (to === "APPROVED" || to === "CANCELLED") {
      // It's moving to production, or it's dead. No action needed.
      newActionRequiredBy = null;
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
        cost: finalCost,
        actionRequiredBy: newActionRequiredBy, 
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