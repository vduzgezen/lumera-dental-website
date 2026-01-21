// app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { 
  calculateCaseCost, 
  countUnits, 
  BillingType, 
  PriceTier 
} from "@/lib/pricing";

const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500MB Limit

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Sanitize filename helper
 */
function sanitizeFileName(original: string, fallbackBase: string): string {
  const baseName = (original || fallbackBase).replace(/\s+/g, "_");
  // Basic sanitization, remove special chars except dots/dashes/underscores
  return baseName.replace(/[^a-zA-Z0-9_.-]/g, "");
}

/**
 * Helper to save a generic file to the case folder and DB
 */
async function saveCaseFile(file: File, caseId: string, label: string) {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", caseId);
  await fs.mkdir(uploadsRoot, { recursive: true });

  const originalName = file.name || `${label}.bin`;
  const safeName = sanitizeFileName(originalName, label);
  
  const buf = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(uploadsRoot, safeName);
  await fs.writeFile(fullPath, buf);

  const publicUrl = `/uploads/${caseId}/${safeName}`;

  // Determine kind based on extension
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

    // Text Fields
    const alias = form.get("patientAlias") as string;
    const doctorUserId = form.get("doctorUserId") as string;
    const toothCodes = form.get("toothCodes") as string;
    const orderDateRaw = form.get("orderDate") as string;
    const product = form.get("product") as string;
    const material = form.get("material") as string;
    const shade = form.get("shade") as string;
    const designPreferences = form.get("designPreferences") as string;
    
    // Billing
    const billingTypeRaw = form.get("billingType");
    const billingType = (billingTypeRaw === "WARRANTY") 
      ? BillingType.WARRANTY 
      : BillingType.BILLABLE;

    // Files
    const scanHtml = form.get("scanHtml") as File | null;
    const rxPdf = form.get("rxPdf") as File | null;
    
    // Optional Files (for later milling stage)
    const constructionInfo = form.get("constructionInfo") as File | null;
    const modelTop = form.get("modelTop") as File | null;
    const modelBottom = form.get("modelBottom") as File | null;

    // --- VALIDATION ---
    if (!alias?.trim()) return NextResponse.json({ error: "Patient alias is required." }, { status: 400 });
    if (!doctorUserId) return NextResponse.json({ error: "Doctor user id is required." }, { status: 400 });
    if (!toothCodes?.trim()) return NextResponse.json({ error: "Tooth codes are required." }, { status: 400 });
    if (!orderDateRaw) return NextResponse.json({ error: "Order date missing." }, { status: 400 });
    if (!product) return NextResponse.json({ error: "Product is required." }, { status: 400 });

    // Mandatory Files Validation (Only Scan & RX Required at Creation)
    if (!scanHtml) return NextResponse.json({ error: "Scan viewer HTML is required." }, { status: 400 });
    if (!rxPdf) return NextResponse.json({ error: "RX PDF is required." }, { status: 400 });

    const orderDate = new Date(orderDateRaw);
    if (Number.isNaN(orderDate.getTime())) {
      return NextResponse.json({ error: "Order date invalid." }, { status: 400 });
    }
    const dueDate = addDays(orderDate, 8);

    // Fetch Doctor Info
    const doctor = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        id: true,
        name: true,
        email: true,
        clinicId: true,
        clinic: { 
          select: { 
            id: true, 
            name: true,
            priceTier: true 
          } 
        },
      },
    });

    if (!doctor || !doctor.clinicId || !doctor.clinic) {
      return NextResponse.json({ error: "Invalid doctor or clinic." }, { status: 400 });
    }

    // --- BILLING CALCULATION ---
    const unitCount = countUnits(toothCodes.trim());
    const tier = doctor.clinic.priceTier || PriceTier.STANDARD;
    const cost = calculateCaseCost(tier, product, unitCount, billingType);

    // --- DB CREATION ---
    const created = await prisma.dentalCase.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        assigneeId: session.userId, // Auto-assign creator (Lab/Admin)
        
        patientAlias: alias.trim(),
        doctorName: doctor.name ?? null,
        toothCodes: toothCodes.trim(),
        orderDate,
        dueDate,
        product: product, 
        material: material?.trim() || null,
        shade: shade?.trim() || null,
        designPreferences: designPreferences?.trim() || null,

        status: "IN_DESIGN", 
        stage: "DESIGN",    
        
        units: unitCount,
        cost: cost,
        billingType: billingType,
        invoiced: false,
      },
      select: { id: true },
    });

    // --- SAVE FILES ---
    // 1. Scan HTML (Mandatory)
    if (scanHtml.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Scan file too large." }, { status: 400 });
    await saveCaseFile(scanHtml, created.id, "scan_html");

    // 2. RX PDF (Mandatory)
    if (rxPdf.size > MAX_FILE_BYTES) return NextResponse.json({ error: "RX file too large." }, { status: 400 });
    await saveCaseFile(rxPdf, created.id, "rx_pdf");

    // 3. Optional Files (Save if provided)
    if (constructionInfo) await saveCaseFile(constructionInfo, created.id, "construction_info");
    if (modelTop) await saveCaseFile(modelTop, created.id, "model_top");
    if (modelBottom) await saveCaseFile(modelBottom, created.id, "model_bottom");

    return NextResponse.json({ ok: true, id: created.id });

  } catch (err) {
    console.error("Create case error:", err);
    return NextResponse.json(
      { error: "Something went wrong creating the case." },
      { status: 500 },
    );
  }
}