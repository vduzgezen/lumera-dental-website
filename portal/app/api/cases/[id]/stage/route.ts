// portal/app/api/cases/[id]/stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";

const STAGE_ORDER: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING"];

export async function PATCH(req: Request, { params }: Params) {
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

  // DIRECT FIX: Use prisma.dentalCase directly
  const existing = await prisma.dentalCase.findUnique({
    where: { id },
    select: {
      id: true,
      stage: true,
      status: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

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

  // Enforce business rules on transitions
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
  } else if (
    currentStage === "MILLING_GLAZING" &&
    targetStage === "SHIPPING"
  ) {
    // When shipping, mark as shipped
    nextStatus = "SHIPPED";
  } else if (currentStage === "DESIGN" && targetStage === "SHIPPING") {
    return NextResponse.json(
      {
        error:
          "Case must go through Milling & Glazing before Shipping.",
      },
      { status: 400 },
    );
  }

  const updated = await prisma.dentalCase.update({
    where: { id },
    data: {
      stage: targetStage,
      status: nextStatus as any,
    },
    select: { id: true, stage: true, status: true },
  });

  return NextResponse.json({ ok: true, stage: updated.stage, status: updated.status });
}