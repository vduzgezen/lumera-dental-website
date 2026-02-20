// portal/app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import type { CaseStatus, ProductionStage } from "@/lib/types";

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
    case "CANCELLED": // ✅ Add Cancelled handler
      return "DESIGN"; // Can default back to design stage, the status overrides the UI.
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

  if (!to) return NextResponse.json({ error: "Missing 'to' status" }, { status: 400 });

  const item = await prisma.dentalCase.findUnique({ 
    where: { id },
    include: { files: true }
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ DOCTOR PERMISSIONS
  if (session.role === "customer") {
    // ✅ Added CANCELLED to allowed doctor actions
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

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.dentalCase.update({
      where: { id },
      data: {
        status: to,
        // Don't change the stage if they are just cancelling it, leave it where it died
        stage: to === "CANCELLED" ? item.stage : newStage,
        designedAt: to === "READY_FOR_REVIEW" ? at : item.designedAt,
        milledAt: to === "IN_MILLING" ? at : item.milledAt,
        shippedAt: to === "SHIPPED" ? at : item.shippedAt,
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