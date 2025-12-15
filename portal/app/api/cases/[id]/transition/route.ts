// app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

type Status =
  | "NEW"
  | "IN_DESIGN"
  | "READY_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "IN_MILLING"
  | "SHIPPED";

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";

function stageForStatus(to: Status): Stage {
  switch (to) {
    case "IN_MILLING":
    case "APPROVED":
      return "MILLING_GLAZING";
    case "SHIPPED":
      return "SHIPPING";
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
  const to = body?.to as Status | undefined;
  const note: string | undefined = body?.note;

  if (!to) return NextResponse.json({ error: "Missing 'to' status" }, { status: 400 });

  const item = await prisma.dentalCase.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Doctors: only APPROVED or CHANGES_REQUESTED on their own case
  if (session.role === "customer") {
    if (!["APPROVED", "CHANGES_REQUESTED"].includes(to)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!session.userId || item.doctorUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const newStage = stageForStatus(to);
  const at = new Date();

  // ---- Transaction with explicit type on `tx`
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.dentalCase.update({
      where: { id },
      data: {
        status: to,
        stage: newStage,
        designedAt: to === "READY_FOR_REVIEW" ? at : item.designedAt,
        milledAt:
          to === "IN_MILLING" || to === "APPROVED" ? at : item.milledAt,
        shippedAt: to === "SHIPPED" ? at : item.shippedAt,
      },
    });

    await tx.statusEvent.create({
      data: {
        caseId: id,
        from: item.status as any,
        to,
        note: note ?? null,
        actorId: session.userId ?? undefined,
      },
    });
  });

  return NextResponse.json({ ok: true, status: to, stage: newStage, at });
}
