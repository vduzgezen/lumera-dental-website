// portal/app/api/cases/[id]/stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

// FIX: Removed NEW and READY_FOR_REVIEW, added COMPLETED
type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED";
const STAGE_ORDER: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED"];

const STAGE_READABLE: Record<Stage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling",
  SHIPPING: "Shipping",
  COMPLETED: "Completed"
};

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
  if (!targetStage || !STAGE_ORDER.includes(targetStage)) {
    return NextResponse.json(
      { error: "Invalid target stage." },
      { status: 400 },
    );
  }

  const existing = await prisma.dentalCase.findUnique({
    where: { id },
    include: { files: true }, // Include files for checking mandatory uploads
  });

  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  // --- MANDATORY FILE CHECK FOR MILLING ---
  // If moving TO Milling, ensure the 3 deferred files are present.
  if (targetStage === "MILLING_GLAZING") {
    const labels = new Set(existing.files.map((f) => f.label));
    const missing: string[] = [];
    
    if (!labels.has("construction_info")) missing.push("Construction Info");
    if (!labels.has("model_top")) missing.push("Model Top");
    if (!labels.has("model_bottom")) missing.push("Model Bottom");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cannot move to Milling. Missing files: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
  }
  // -----------------------------------------

  const currentStage = existing.stage as Stage;
  const currentStatus = existing.status as string;

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  if (targetIndex === -1) {
    return NextResponse.json(
      { error: "Unsupported stage." },
      { status: 400 },
    );
  }

  if (targetIndex === currentIndex) {
    return NextResponse.json({ ok: true, stage: currentStage });
  }

  if (targetIndex < currentIndex) {
    return NextResponse.json(
      { error: "Process cannot move backwards." },
      { status: 400 },
    );
  }

  let nextStatus = currentStatus;
  
  if (currentStage === "DESIGN" && targetStage === "MILLING_GLAZING") {
    if (currentStatus !== "APPROVED") {
      return NextResponse.json(
        {
          error:
            "Case must be APPROVED before moving to Milling & Glazing.",
        },
        { status: 400 },
      );
    }
    nextStatus = "IN_MILLING";
  } 
  else if (
    currentStage === "MILLING_GLAZING" &&
    targetStage === "SHIPPING"
  ) {
    nextStatus = "SHIPPED";
  } 
  else if (
    currentStage === "SHIPPING" &&
    targetStage === "COMPLETED"
  ) {
    nextStatus = "COMPLETED";
  }
  else if (currentStage === "DESIGN" && targetStage === "SHIPPING") {
    return NextResponse.json(
      {
        error:
          "Case must go through Milling & Glazing before Shipping.",
      },
      { status: 400 },
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.dentalCase.update({
      where: { id },
      data: {
        stage: targetStage,
        status: nextStatus as any,
      },
      select: { id: true, stage: true, status: true },
    }),
    prisma.statusEvent.create({
      data: {
        caseId: id,
        from: currentStatus,
        to: nextStatus,
        // FIX: Set note to null so History tab is clean
        note: null, 
        actorId: session.userId,
      }
    })
  ]);

  return NextResponse.json({ ok: true, stage: updated.stage, status: updated.status });
}