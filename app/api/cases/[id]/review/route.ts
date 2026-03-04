// app/api/cases/[id]/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { needsReview, question } = await req.json();
  
  if (typeof needsReview !== "boolean") {
    return NextResponse.json({ error: "needsReview boolean required" }, { status: 400 });
  }

  // DIRECT FIX: Use prisma.dentalCase directly
  const item = await prisma.dentalCase.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "customer") {
    if (!session.clinicId || session.clinicId !== item.clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Doctors cannot REQUEST a review (they only answer them)
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

  await prisma.dentalCase.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}