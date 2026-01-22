// portal/app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { 
  calculateCaseCost, 
  countUnits, 
  PriceTier 
} from "@/lib/pricing";
import { CreateCaseSchema } from "@/lib/schemas"; // <--- Zod Schema

const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500MB Limit

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sanitizeFileName(original: string, fallbackBase: string): string {
  const baseName = (original || fallbackBase).replace(/\s+/g, "_");
  return baseName.replace(/[^a-zA-Z0-9_.-]/g, "");
}

async function saveCaseFile(file: File, caseId: string, label: string) {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", caseId);
  await fs.mkdir(uploadsRoot, { recursive: true });

  const originalName = file.name || `${label}.bin`;
  const safeName = sanitizeFileName(originalName, label);
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(uploadsRoot, safeName);
  await fs.writeFile(fullPath, buf);

  const publicUrl = `/uploads/${caseId}/${safeName}`;
  let kind = "OTHER";
  const lower = safeName.toLowerCase();
  if (lower.endsWith(".stl")) kind = "STL";
  else if (lower.endsWith(".ply")) kind = "PLY";
  else if (lower.endsWith(".obj")) kind = "OBJ";
  else if (lower.endsWith(".pdf")) kind = "PDF";
  else if (lower.endsWith(".html") || lower.endsWith(".htm")) kind = "OTHER";

  await prisma.caseFile.create({
    data: {
      caseId,
      label,
      kind,
      url: publicUrl,
      sizeBytes: buf.length,
    },
  });
}

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    if (session.role === "customer") {
      return NextResponse.json({ error: "Only lab/admin can create cases." }, { status: 403 });
    }

    // 2. Parse FormData
    const form = await req.formData();
    
    // Convert FormData to a plain object for Zod
    const rawData = {
      patientAlias: form.get("patientAlias"),
      doctorUserId: form.get("doctorUserId"),
      toothCodes: form.get("toothCodes"),
      orderDate: form.get("orderDate"),
      product: form.get("product"),
      shade: form.get("shade") || undefined,
      material: form.get("material") || undefined,
      designPreferences: form.get("designPreferences") || undefined,
      billingType: form.get("billingType") || undefined,
      // Files
      scanHtml: form.get("scanHtml"),
      rxPdf: form.get("rxPdf"),
      constructionInfo: form.get("constructionInfo"),
      modelTop: form.get("modelTop"),
      modelBottom: form.get("modelBottom"),
    };

    // 3. Zod Validation (The Bouncer)
    const validation = CreateCaseSchema.safeParse(rawData);

    if (!validation.success) {
      // ✅ FIX: Use .issues instead of .errors
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: `${firstError.path.join(".")}: ${firstError.message}` }, 
        { status: 400 }
      );
    }

    const data = validation.data; // Safe, typed data

    // 4. Business Logic (Doctor/Clinic Lookup)
    const doctor = await prisma.user.findUnique({
      where: { id: data.doctorUserId },
      select: {
        id: true,
        name: true,
        clinicId: true,
        clinic: { select: { id: true, priceTier: true } },
      },
    });

    if (!doctor || !doctor.clinicId || !doctor.clinic) {
      return NextResponse.json({ error: "Invalid doctor or clinic." }, { status: 400 });
    }

    // 5. Billing Calculation
    const unitCount = countUnits(data.toothCodes);
    const dueDate = addDays(data.orderDate, 8);
    
    const cost = calculateCaseCost(
        doctor.clinic.priceTier || PriceTier.STANDARD, 
        data.product, 
        unitCount, 
        data.billingType
    );

    // 6. DB Creation
    const created = await prisma.dentalCase.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        assigneeId: session.userId,
        patientAlias: data.patientAlias,
        doctorName: doctor.name ?? null,
        toothCodes: data.toothCodes,
        orderDate: data.orderDate,
        dueDate,
        product: data.product,
        material: data.material || null,
        shade: data.shade || null,
        designPreferences: data.designPreferences || null,
        status: "IN_DESIGN",
        stage: "DESIGN",
        units: unitCount,
        cost,
        billingType: data.billingType,
        invoiced: false,
      },
      select: { id: true },
    });

    // 7. Save Files
    if (data.scanHtml.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Scan file too large." }, { status: 400 });
    await saveCaseFile(data.scanHtml, created.id, "scan_html");

    if (data.rxPdf.size > MAX_FILE_BYTES) return NextResponse.json({ error: "RX file too large." }, { status: 400 });
    await saveCaseFile(data.rxPdf, created.id, "rx_pdf");

    if (data.constructionInfo) await saveCaseFile(data.constructionInfo, created.id, "construction_info");
    if (data.modelTop) await saveCaseFile(data.modelTop, created.id, "model_top");
    if (data.modelBottom) await saveCaseFile(data.modelBottom, created.id, "model_bottom");

    return NextResponse.json({ ok: true, id: created.id });

  } catch (err) {
    console.error("Create case error:", err);
    return NextResponse.json(
      { error: "Something went wrong creating the case." },
      { status: 500 },
    );
  }
}