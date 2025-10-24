import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stage } = await req.json(); // "DESIGN" | "MILLING_GLAZING" | "SHIPPING"
  if (!["DESIGN","MILLING_GLAZING","SHIPPING"].includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;

  const now = new Date();
  const stamp: any = {};
  if (stage === "DESIGN") stamp.designedAt = now;
  if (stage === "MILLING_GLAZING") stamp.milledAt = now;
  if (stage === "SHIPPING") stamp.shippedAt = now;

  const updated = await CaseModel.update({
    where: { id: params.id },
    data: { stage, ...stamp },
  });

  return NextResponse.json({ ok: true, stage: updated.stage });
}
