// app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CaseStatus, ProductionStage, Prisma } from "@prisma/client";

function stageForStatus(to: CaseStatus): ProductionStage {
  switch (to) {
    case CaseStatus.IN_MILLING:
    case CaseStatus.APPROVED:
      return ProductionStage.MILLING_GLAZING;
    case CaseStatus.SHIPPED:
      return ProductionStage.SHIPPING;
    default:
      return ProductionStage.DESIGN;
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
    // FIX: Cast the array to CaseStatus[] to allow checking any status against it
    const allowedForDoctor = [CaseStatus.APPROVED, CaseStatus.CHANGES_REQUESTED] as CaseStatus[];
    
    if (!allowedForDoctor.includes(to)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!session.userId || item.doctorUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const newStage = stageForStatus(to);
  const at = new Date();

  // Explicit type for transaction client
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.dentalCase.update({
      where: { id },
      data: {
        status: to,
        stage: newStage,
        designedAt: to === CaseStatus.READY_FOR_REVIEW ? at : item.designedAt,
        milledAt:
          to === CaseStatus.IN_MILLING || to === CaseStatus.APPROVED ? at : item.milledAt,
        shippedAt: to === CaseStatus.SHIPPED ? at : item.shippedAt,
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