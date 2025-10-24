import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Helper to resolve model names regardless of how the client generated them */
function getModels() {
  const g: any = prisma as any;
  return {
    CaseModel: g.dentalCase ?? g.case ?? g.case_,
    CommentModel: g.caseComment ?? g.case_comment ?? g.casecomment,
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { CaseModel, CommentModel } = getModels();

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comments = await CommentModel.findMany({
    where: { caseId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { CaseModel, CommentModel } = getModels();

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body || String(body).trim().length === 0) {
    return NextResponse.json({ error: "Empty" }, { status: 400 });
  }

  const c = await CommentModel.create({
    data: {
      caseId: params.id,
      authorId: session.userId,
      body: String(body).slice(0, 2000),
    },
  });

  return NextResponse.json({ ok: true, comment: c });
}
