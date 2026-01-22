// app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import type { CaseStatus, ProductionStage } from "@/lib/types";

// FIX: 'APPROVED' now keeps the stage as 'DESIGN'.
// This ensures the case waits in the Design bucket until the Lab clicks "Start Milling".
function stageForStatus(to: CaseStatus): ProductionStage {
  switch (to) {
    case "IN_MILLING":
      return "MILLING_GLAZING";
    case "SHIPPED":
      return "SHIPPING";
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

  const item = await prisma.dentalCase.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Doctors: only APPROVED or CHANGES_REQUESTED on their own case
  if (session.role === "customer") {
    const allowedForDoctor: CaseStatus[] = ["APPROVED", "CHANGES_REQUESTED"];
    if (!allowedForDoctor.includes(to)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!session.userId || item.doctorUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // FIX: Guard rail - prevent re-approving if already approved/in production
  if (to === "APPROVED") {
    if (["APPROVED", "IN_MILLING", "SHIPPED"].includes(item.status)) {
      return NextResponse.json({ error: "Case is already approved." }, { status: 400 });
    }
  }

  const newStage = stageForStatus(to);
  const at = new Date();

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.dentalCase.update({
      where: { id },
      data: {
        status: to,
        stage: newStage,
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