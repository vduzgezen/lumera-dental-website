// app/api/cases/new/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const ACCEPT_SCAN = new Set(["stl", "ply", "obj"]);
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (session.role === "customer") return NextResponse.json({ error: "Only lab/admin can create cases." }, { status: 403 });

    const form = await req.formData();
    const alias        = String(form.get("patientAlias") || "").trim();
    const toothCodes   = String(form.get("toothCodes") || "").trim();
    const doctorUserId = String(form.get("doctorUserId") || "").trim();
    const product      = String(form.get("product") || "").trim();
    const material     = (form.get("material") || "") as string;
    const shade        = (form.get("shade") || "") as string;
    const orderDateIn  = (form.get("orderDate") || "") as string;
    const scanFile     = form.get("scan");

    if (!alias || !toothCodes || !doctorUserId || !(scanFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing info. Required: Doctor, Alias, Tooth codes, and a Scan file." },
        { status: 400 }
      );
    }

    const doctor = await prisma.user.findUnique({ where: { id: doctorUserId }, include: { clinic: true } });
    if (!doctor || doctor.role !== "customer" || !doctor.clinic) {
      return NextResponse.json({ error: "Selected doctor is not valid or not linked to a clinic." }, { status: 400 });
    }

    const orderDate = orderDateIn ? new Date(orderDateIn) : new Date();
    if (isNaN(orderDate.getTime())) {
      return NextResponse.json({ error: "Invalid order date. Use the date picker (YYYY-MM-DD)." }, { status: 400 });
    }
    const dueDate = addDays(orderDate, 8);

    if (scanFile.size > MAX_SIZE) return NextResponse.json({ error: "Scan file is too large (max ~200MB)." }, { status: 413 });

    const ext = (scanFile.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPT_SCAN.has(ext)) {
      return NextResponse.json({ error: "Scan must be STL, PLY, or OBJ." }, { status: 400 });
    }

    const okProducts = new Set(["ZIRCONIA", "MULTILAYER_ZIRCONIA", "EMAX", "INLAY_ONLAY"]);
    if (!okProducts.has(product)) {
      return NextResponse.json({ error: "Please choose a valid product." }, { status: 400 });
    }

    const created = await prisma.dentalCase.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        patientAlias: alias,
        doctorName: doctor.name || null, // auto-snapshot name
        toothCodes,
        product: product as any,
        material: material || null,
        shade: shade || null,
        orderDate,
        dueDate,
        status: "IN_DESIGN",
        stage: "DESIGN",
        designedAt: new Date(),
      } as any,
      select: { id: true },
    });

    const root = path.join(process.cwd(), "public", "uploads", created.id);
    await fs.mkdir(root, { recursive: true });
    const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const fullpath = path.join(root, name);
    const buf = Buffer.from(await (scanFile as File).arrayBuffer());
    await fs.writeFile(fullpath, buf);

    const extUpper = ext.toUpperCase();
    const kindAny = (["STL", "PLY", "OBJ"].includes(extUpper) ? extUpper : "OTHER") as any;
    const publicUrl = `/uploads/${created.id}/${name}`;

    await prisma.caseFile.create({
      data: { caseId: created.id, label: "scan", kind: kindAny, url: publicUrl, sizeBytes: buf.length } as any,
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    console.error("Create case error:", e);
    return NextResponse.json({ error: "Something went wrong creating the case. Please try again." }, { status: 500 });
  }
}
