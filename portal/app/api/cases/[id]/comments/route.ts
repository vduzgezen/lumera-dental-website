// app/api/cases/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { body } = await req.json();

  if (!body || !String(body).trim()) {
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  }

  const c = await prisma.caseComment.create({
    data: {
      caseId: id,
      authorId: session.userId!,
      body: String(body).trim(),
    },
  });

  return NextResponse.json({ ok: true, id: c.id });
}
