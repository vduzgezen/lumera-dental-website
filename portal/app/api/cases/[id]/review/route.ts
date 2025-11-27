// app/api/cases/[id]/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { needsReview, question } = await req.json();
  if (typeof needsReview !== "boolean") {
    return NextResponse.json({ error: "needsReview boolean required" }, { status: 400 });
  }

  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "customer") {
    if (!session.clinicId || session.clinicId !== item.clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (needsReview === true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const data: any = { needsReview };
  if (needsReview) {
    data.reviewQuestion = (question ?? "").toString().slice(0, 500);
    data.reviewRequestedAt = new Date();
  } else {
    data.reviewQuestion = null;
  }

  await CaseModel.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}
