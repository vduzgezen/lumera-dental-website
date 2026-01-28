// portal/app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";

const MAX_FILE_BYTES = 500 * 1024 * 1024; 

// --- 1. UPDATE ZOD SCHEMA ---
const CreateCaseSchema = z.object({
  // ✅ NEW: Add name fields here
  patientFirstName: z.string().min(1, "First Name is required"),
  patientLastName: z.string().min(1, "Last Name is required"),
  
  patientAlias: z.string().min(1, "Patient Alias is required"),
  doctorUserId: z.string().min(1, "Doctor is required"),
  clinicId: z.string().min(1, "Clinic is required"),
  toothCodes: z.string().min(1, "Tooth selection is required"),
  
  orderDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid Order Date"),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid Due Date").optional(),

  product: z.string().min(1, "Product is required"),
  material: z.string().optional(),
  shade: z.string().optional(),
  designPreferences: z.string().optional(),
  serviceLevel: z.enum(["IN_HOUSE", "STANDARD"]).default("IN_HOUSE"),
  
  scanHtml: z.instanceof(File, { message: "Scan Viewer HTML is required" }),
  rxPdf: z.instanceof(File, { message: "Rx PDF is required" }),
  
  constructionInfo: z.instanceof(File).optional(),
  modelTop: z.instanceof(File).optional(),
  modelBottom: z.instanceof(File).optional(),
});

// ... (Keep existing helpers: addDays, sanitizeFileName, saveCaseFile, getUniqueAlias, calculateEstimate) ...
function addDays(d: string | Date, n: number) {
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

async function getUniqueAlias(baseAlias: string) {
  const root = baseAlias.slice(0, -2); 
  const existing = await prisma.dentalCase.findMany({
    where: { patientAlias: { startsWith: root } },
    select: { patientAlias: true }
  });

  if (existing.length === 0) return baseAlias;

  let maxSuffix = -1;
  existing.forEach((c) => {
    const suffix = parseInt(c.patientAlias.slice(-2), 10);
    if (!isNaN(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  });

  const nextSuffix = (maxSuffix + 1).toString().padStart(2, "0");
  return `${root}${nextSuffix}`;
}

function calculateEstimate(product: string, serviceLevel: string, toothCodes: string) {
  const units = toothCodes.split(",").filter(Boolean).length;
  let basePrice = 0;
  if (product === "ZIRCONIA") basePrice = serviceLevel === "IN_HOUSE" ? 55 : 65;
  else if (product === "EMAX") basePrice = serviceLevel === "IN_HOUSE" ? 110 : 120;
  else if (product === "NIGHTGUARD") basePrice = serviceLevel === "IN_HOUSE" ? 50 : 60;
  else if (product === "INLAY_ONLAY") basePrice = serviceLevel === "IN_HOUSE" ? 65 : 75;
  return basePrice * units;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    const form = await req.formData();
    
    const getFile = (key: string) => {
      const f = form.get(key);
      return f instanceof File ? f : undefined;
    };

    const rawData = {
      // ✅ NEW: Extract names from form
      patientFirstName: form.get("patientFirstName"),
      patientLastName: form.get("patientLastName"),
      
      patientAlias: form.get("patientAlias"),
      doctorUserId: form.get("doctorUserId"),
      clinicId: form.get("clinicId"),
      toothCodes: form.get("toothCodes"),
      orderDate: form.get("orderDate"),
      dueDate: form.get("dueDate"),
      product: form.get("product"),
      shade: form.get("shade") || undefined,
      material: form.get("material") || undefined,
      designPreferences: form.get("designPreferences") || undefined,
      serviceLevel: form.get("serviceLevel") || "IN_HOUSE",
      
      scanHtml: getFile("scanHtml"),
      rxPdf: getFile("rxPdf"),
      constructionInfo: getFile("constructionInfo"),
      modelTop: getFile("modelTop"),
      modelBottom: getFile("modelBottom"),
    };

    const validation = CreateCaseSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: `${firstError.path.join(".")}: ${firstError.message}` }, 
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify Doctor
    const doctor = await prisma.user.findUnique({
      where: { id: data.doctorUserId },
      select: { id: true, name: true },
    });
    if (!doctor) return NextResponse.json({ error: "Invalid doctor." }, { status: 400 });

    // Verify Clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: data.clinicId },
      select: { id: true, priceTier: true },
    });
    if (!clinic) return NextResponse.json({ error: "Invalid clinic." }, { status: 400 });

    const uniqueAlias = await getUniqueAlias(data.patientAlias);
    const cost = calculateEstimate(data.product, data.serviceLevel, data.toothCodes);
    const unitCount = data.toothCodes.split(",").filter(Boolean).length;
    const dueDate = data.dueDate ? new Date(data.dueDate) : addDays(data.orderDate, 8);

    const created = await prisma.dentalCase.create({
      data: {
        clinicId: clinic.id,
        doctorUserId: doctor.id,
        assigneeId: session.userId, 
        
        // ✅ NEW: Save Names (Now available in data because of Zod schema)
        patientFirstName: data.patientFirstName,
        patientLastName: data.patientLastName,
        patientAlias: uniqueAlias,
        
        doctorName: doctor.name ?? null,
        toothCodes: data.toothCodes,
        orderDate: new Date(data.orderDate),
        dueDate: dueDate, 
        product: data.product,
        material: data.material || null,
        serviceLevel: data.serviceLevel, 
        shade: data.shade || null,
        designPreferences: data.designPreferences || null,
        status: "IN_DESIGN",
        stage: "DESIGN",
        units: unitCount,
        cost,
        billingType: "BILLABLE",
        invoiced: false,
      },
      select: { id: true },
    });

    await saveCaseFile(data.scanHtml, created.id, "scan_html");
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