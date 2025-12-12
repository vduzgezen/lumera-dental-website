// app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";

const ACCEPT_SCAN_EXT = new Set([".stl", ".ply", ".obj"]);
const MAX_SCAN_BYTES = 200 * 1024 * 1024; // 200MB

/** DentalCase may be named differently in Prisma client */
function getCaseModel(p: any) {
  return p.dentalCase ?? p.case ?? p.case_;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

function chooseExtAndKind(
  originalName: string,
): { ext: string; kind: "STL" | "PLY" | "OBJ" } {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".stl")) return { ext: ".stl", kind: "STL" };
  if (lower.endsWith(".ply")) return { ext: ".ply", kind: "PLY" };
  if (lower.endsWith(".obj")) return { ext: ".obj", kind: "OBJ" };

  // Default to STL if extension missing but we accepted it as a scan
  return { ext: ".stl", kind: "STL" };
}

/**
 * Sanitize the uploaded filename:
 * - Replace spaces with underscores
 * - Keep the extension (.stl/.ply/.obj)
 * - Strip problematic URL chars like '#' and '?'
 */
function sanitizeFileName(original: string): string {
  const noSpaces = original.replace(/\s+/g, "_");

  const lastDot = noSpaces.lastIndexOf(".");
  if (lastDot === -1) {
    // No extension – just strip bad chars from whole string
    return noSpaces.replace(/[?#]/g, "");
  }

  const base = noSpaces.slice(0, lastDot);
  const ext = noSpaces.slice(lastDot); // includes '.'

  const cleanedBase = base.replace(/[?#]/g, "");

  return cleanedBase + ext;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    if (session.role === "customer") {
      return NextResponse.json(
        { error: "Only lab/admin can create cases." },
        { status: 403 },
      );
    }

    const form = await req.formData();

    const alias = form.get("patientAlias");
    const doctorUserId = form.get("doctorUserId");
    const toothCodes = form.get("toothCodes");
    const orderDateRaw = form.get("orderDate");
    const product = form.get("product");
    const material = form.get("material");
    const shade = form.get("shade");
    const scan = form.get("scan");

    if (typeof alias !== "string" || !alias.trim()) {
      return NextResponse.json(
        { error: "Patient alias is required." },
        { status: 400 },
      );
    }
    if (typeof doctorUserId !== "string" || !doctorUserId) {
      return NextResponse.json(
        { error: "Doctor user id is required." },
        { status: 400 },
      );
    }
    if (typeof toothCodes !== "string" || !toothCodes.trim()) {
      return NextResponse.json(
        { error: "Tooth codes are required." },
        { status: 400 },
      );
    }
    if (typeof orderDateRaw !== "string") {
      return NextResponse.json(
        { error: "Order date missing or invalid." },
        { status: 400 },
      );
    }
    if (typeof product !== "string" || !product) {
      return NextResponse.json(
        { error: "Product is required." },
        { status: 400 },
      );
    }
    if (!(scan instanceof File)) {
      return NextResponse.json(
        { error: "Scan file is required." },
        { status: 400 },
      );
    }

    const orderDate = new Date(orderDateRaw);
    if (Number.isNaN(orderDate.getTime())) {
      return NextResponse.json(
        { error: "Order date invalid." },
        { status: 400 },
      );
    }
    const dueDate = addDays(orderDate, 8);

    const doctor = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        clinicId: true,
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!doctor || doctor.role !== "customer") {
      return NextResponse.json(
        { error: "Doctor account not found." },
        { status: 400 },
      );
    }
    if (!doctor.clinicId || !doctor.clinic) {
      return NextResponse.json(
        { error: "Doctor has no clinic linked." },
        { status: 400 },
      );
    }

    // Validate scan extension and size
    const originalName = scan.name || "scan";
    const lower = originalName.toLowerCase();
    const ext =
      lower.lastIndexOf(".") !== -1 ? lower.slice(lower.lastIndexOf(".")) : "";
    if (!ACCEPT_SCAN_EXT.has(ext as any)) {
      return NextResponse.json(
        { error: "Scan must be STL, PLY, or OBJ." },
        { status: 400 },
      );
    }

    const scanBuf = Buffer.from(await scan.arrayBuffer());
    if (scanBuf.length > MAX_SCAN_BYTES) {
      return NextResponse.json(
        { error: "Scan file is too large." },
        { status: 400 },
      );
    }

    const caseModel = getCaseModel(prisma as any);

    const created = await caseModel.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        patientAlias: alias.trim(),
        doctorName: doctor.name ?? null,
        toothCodes: toothCodes.trim(),
        orderDate,
        dueDate,
        product: product as any,
        material:
          typeof material === "string" && material.trim()
            ? material.trim()
            : null,
        shade:
          typeof shade === "string" && shade.trim() ? shade.trim() : null,
        status: "IN_DESIGN",
        stage: "DESIGN",
      } as any,
      select: { id: true },
    });

    // Save scan under /public/uploads/<caseId>/<safe filename>
    const uploadsRoot = path.join(
      process.cwd(),
      "public",
      "uploads",
      created.id,
    );
    await fs.mkdir(uploadsRoot, { recursive: true });

    const { ext: chosenExt, kind } = chooseExtAndKind(originalName);

    // ✅ Sanitize filename & ensure correct extension
    let safeName = sanitizeFileName(originalName);
    if (!safeName.toLowerCase().endsWith(chosenExt)) {
      // If user had weird/missing/ext, enforce what we decided in chooseExtAndKind
      safeName = safeName.replace(/\.+$/, ""); // trim trailing dots if any
      safeName += chosenExt;
    }

    const fullPath = path.join(uploadsRoot, safeName);
    await fs.writeFile(fullPath, scanBuf);

    const publicUrl = `/uploads/${created.id}/${safeName}`;

    await prisma.caseFile.create({
      data: {
        caseId: created.id,
        label: "scan",
        kind: kind as any,
        url: publicUrl,
        sizeBytes: scanBuf.length,
      } as any,
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("Create case error:", err);
    return NextResponse.json(
      { error: "Something went wrong creating the case." },
      { status: 500 },
    );
  }
}
