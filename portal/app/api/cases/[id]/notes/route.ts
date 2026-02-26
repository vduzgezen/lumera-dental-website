// app/api/cases/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session || !["lab", "admin", "milling"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notes } = await req.json();

    await prisma.dentalCase.update({
      where: { id },
      data: { caseNotes: notes || null },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Save notes error:", e);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}