// portal/app/api/cases/[id]/stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED";
const STAGE_ORDER: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED"];

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (session.role !== "admin" && session.role !== "lab") {
    return NextResponse.json(
      { error: "Only lab/admin can update the process." },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const targetStage = body?.stage as Stage | undefined;
  const forceReview = body?.forceReview === true; // ✅ Extract Manual Override Checkbox

  if (!targetStage || !STAGE_ORDER.includes(targetStage)) {
    return NextResponse.json(
      { error: "Invalid target stage." },
      { status: 400 },
    );
  }

  if (targetStage === "MILLING_GLAZING" && session.role === "lab") {
    return NextResponse.json(
        { error: "Lab users cannot manually start milling. This happens automatically when the Milling Center downloads the files." },
        { status: 403 }
    );
  }

  const existing = await prisma.dentalCase.findUnique({
    where: { id },
    include: { doctorUser: { select: { requiresStrictDesignApproval: true } } } // ✅ Pull Doctor Pref
  });

  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const currentStage = existing.stage as Stage;
  const currentStatus = existing.status as string;

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  if (targetIndex === -1) {
    return NextResponse.json({ error: "Unsupported stage." }, { status: 400 });
  }

  if (targetIndex === currentIndex) {
    return NextResponse.json({ ok: true, stage: currentStage });
  }

  if (targetIndex < currentIndex) {
    return NextResponse.json({ error: "Process cannot move backwards." }, { status: 400 });
  }

  let nextStatus = currentStatus;
  let newActionRequiredBy = existing.actionRequiredBy;
  
  if (currentStage === "DESIGN" && targetStage === "MILLING_GLAZING") {
    // ✅ THE TRIAGE ENGINE: Evaluate Review Requirements
    const needsReview = forceReview || existing.doctorUser?.requiresStrictDesignApproval;

    if (currentStatus !== "APPROVED") {
        if (needsReview) {
            // Intercept the progression. Set to Review, assign action to Doctor.
            await prisma.dentalCase.update({
                where: { id },
                data: {
                    status: "READY_FOR_REVIEW",
                    actionRequiredBy: "DOCTOR"
                }
            });
            await prisma.statusEvent.create({
                data: { caseId: id, from: currentStatus, to: "READY_FOR_REVIEW", note: "Design submitted for Doctor approval.", actorId: session.userId }
            });
            return NextResponse.json({ ok: true, stage: currentStage, status: "READY_FOR_REVIEW" });
        } else {
            // Auto-Approve the case because the doctor trusts the lab and there are no issues.
            nextStatus = "IN_MILLING";
        }
    } else {
        nextStatus = "IN_MILLING";
    }
  } 
  else if (currentStage === "MILLING_GLAZING" && targetStage === "SHIPPING") {
    nextStatus = "SHIPPED";
  } 
  else if (currentStage === "SHIPPING" && targetStage === "COMPLETED") {
    nextStatus = "COMPLETED";
  }
  else if (currentStage === "DESIGN" && targetStage === "SHIPPING") {
    return NextResponse.json({ error: "Case must go through Milling & Glazing before Shipping." }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.dentalCase.update({
      where: { id },
      data: {
        stage: targetStage,
        status: nextStatus as any,
        actionRequiredBy: newActionRequiredBy
      },
      select: { id: true, stage: true, status: true },
    }),
    prisma.statusEvent.create({
      data: {
        caseId: id,
        from: currentStatus,
        to: nextStatus,
        note: null, 
        actorId: session.userId,
      }
    })
  ]);

  return NextResponse.json({ ok: true, stage: updated.stage, status: updated.status });
}