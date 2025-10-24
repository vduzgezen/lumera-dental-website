// app/api/cases/[id]/transition/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Body = { to: string; note?: string };

const ALLOWED_FOR_CUSTOMER = new Set(["APPROVED", "CHANGES_REQUESTED"]);
const ALL_STATUSES = new Set([
  "NEW",
  "IN_DESIGN",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "IN_MILLING",
  "SHIPPED",
]);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, note }: Body = await req.json();
    if (!ALL_STATUSES.has(to)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Resolve model name (DentalCase/case/case_) on the **global** client (read-only step)
    const g: any = prisma as any;
    const GlobalCase = g.dentalCase ?? g.case ?? g.case_;

    const item = await GlobalCase.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // RBAC
    if (session.role === "customer") {
      if (!session.clinicId || session.clinicId !== item.clinicId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!ALLOWED_FOR_CUSTOMER.has(to)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Prepare event data (remove `note` line if your schema doesn't have it yet)
    const eventData: any = {
      caseId: item.id,
      from: item.status,
      to,
      actorId: session.userId,
    };
    if (note != null) eventData.note = String(note).slice(0, 500);

    // ✅ Interactive transaction, but we use **only `tx`** inside (no mixing), + longer timeout
    const updated = await prisma.$transaction(
      async (tx: any) => {
        const TxCase = tx.dentalCase ?? tx.case ?? tx.case_;        // resolve on tx
        const TxStatusEvent = tx.statusEvent ?? tx.status_event ?? tx.statusevent;

        await TxStatusEvent.create({ data: eventData });
        const upd = await TxCase.update({
          where: { id: item.id },
          data: { status: to },
        });
        return upd;
      },
      { timeout: 15000 } // ms
    );

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (e: any) {
    console.error("Transition error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
