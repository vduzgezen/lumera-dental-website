import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { needsReview, question } = await req.json(); // needsReview: boolean
  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // customer can only clear their own case's review; lab/admin can set or clear
  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.role === "customer" && needsReview === true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: any = { needsReview };
  if (needsReview) {
    data.reviewQuestion = (question ?? "").slice(0, 500);
    data.reviewRequestedAt = new Date();
  } else {
    data.reviewQuestion = null;
  }

  await CaseModel.update({ where: { id: params.id }, data });

  // TODO: hook SMS here (Twilio) — for now we just log:
  console.log(`[SMS] Case ${params.id}: needsReview=${needsReview}`);
  return NextResponse.json({ ok: true });
}
