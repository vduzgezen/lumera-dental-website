// app/api/cases/[id]/stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const STAGES = ["DESIGN", "MILLING_GLAZING", "SHIPPING"] as const;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stage } = await req.json();
  if (!STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const data: any = { stage };
  if (stage === "DESIGN" && !item.designedAt) data.designedAt = now;
  if (stage === "MILLING_GLAZING" && !item.milledAt) data.milledAt = now;
  if (stage === "SHIPPING" && !item.shippedAt) data.shippedAt = now;

  const updated = await CaseModel.update({ where: { id: item.id }, data });

  return NextResponse.json({ ok: true, stage: updated.stage });
}
