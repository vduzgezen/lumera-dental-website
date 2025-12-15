// app/api/cases/[id]/shipping/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { carrier, tracking, eta } = await req.json();

  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;

  const data: any = {};
  if (carrier !== undefined) data.shippingCarrier = String(carrier).slice(0, 100);
  if (tracking !== undefined) data.trackingNumber = String(tracking).slice(0, 100);
  if (eta !== undefined) {
    if (eta === null || eta === "") data.shippingEta = null;
    else {
      const d = new Date(eta);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid ETA" }, { status: 400 });
      data.shippingEta = d;
    }
  }

  const updated = await CaseModel.update({ where: { id: params.id }, data });
  return NextResponse.json({
    ok: true,
    shipping: {
      carrier: updated.shippingCarrier,
      tracking: updated.trackingNumber,
      eta: updated.shippingEta,
    },
  });
}
