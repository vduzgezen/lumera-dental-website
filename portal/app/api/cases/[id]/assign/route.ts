// app/api/cases/[id]/assign/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    // CHANGED: Only "admin" can assign. "lab" cannot.
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();
    const { assigneeId } = body;

    // assigneeId can be null (unassigned) or a valid UUID
    if (assigneeId && typeof assigneeId !== "string") {
      return NextResponse.json({ error: "Invalid assignee ID" }, { status: 400 });
    }

    await prisma.dentalCase.update({
      where: { id },
      data: {
        assigneeId: assigneeId || null
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Assignment error:", e);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}