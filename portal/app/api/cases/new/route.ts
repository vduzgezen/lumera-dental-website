// app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { 
  calculateCaseCost, 
  countUnits, 
  ProductKind, 
  BillingType, 
  PriceTier 
} from "@/lib/pricing";

const MAX_SCAN_VIEWER_BYTES = 200 * 1024 * 1024; // 200MB

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Sanitize an HTML filename
 */
function sanitizeHtmlFileName(original: string, fallbackBase: string): string {
  const baseName = (original || fallbackBase).replace(/\s+/g, "_");
  const lower = baseName.toLowerCase();

  let ext = ".html";
  if (lower.endsWith(".html")) {
    ext = ".html";
  } else if (lower.endsWith(".htm")) {
    ext = ".htm";
  }

  let nameWithoutExt = baseName;
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const idx = baseName.lastIndexOf(".");
    if (idx >= 0) {
      nameWithoutExt = baseName.slice(0, idx);
    }
  }

  const cleanedBase = nameWithoutExt.replace(/[?#]/g, "");
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
    const scanViewerRaw = form.get("scanHtml") ?? form.get("scan");
    
    const billingTypeRaw = form.get("billingType");
    const billingType = (billingTypeRaw === "WARRANTY") 
      ? BillingType.WARRANTY 
      : BillingType.BILLABLE;

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

    if (!(scanViewerRaw instanceof File)) {
      return NextResponse.json(
        { error: "Scan viewer HTML is required." },
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

    // Fetch Doctor AND Clinic Price Tier
    const doctor = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        clinicId: true,
        clinic: { 
          select: { 
            id: true, 
            name: true,
            priceTier: true // Cleaned syntax here
          } 
        },
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

    // Validate scan viewer type and size
    const scanViewer = scanViewerRaw as File;
    const originalName = scanViewer.name || "scan_viewer.html";
    const lower = originalName.toLowerCase();
    if (!lower.endsWith(".html") && !lower.endsWith(".htm")) {
      return NextResponse.json(
        { error: "Scan viewer must be an HTML file." },
        { status: 400 },
      );
    }

    const scanBuf = Buffer.from(await scanViewer.arrayBuffer());
    if (scanBuf.length > MAX_SCAN_VIEWER_BYTES) {
      return NextResponse.json(
        { error: "Scan viewer file is too large." },
        { status: 400 },
      );
    }

    // --- BILLING CALCULATION ---
    const unitCount = countUnits(toothCodes.trim());
    // Default to STANDARD if missing or invalid
    const tier = doctor.clinic.priceTier || PriceTier.STANDARD;
    const cost = calculateCaseCost(
      tier,
      product, 
      unitCount,
      billingType
    );

    // Create Case with Billing Data
    const created = await prisma.dentalCase.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        patientAlias: alias.trim(),
        doctorName: doctor.name ?? null,
        toothCodes: toothCodes.trim(),
        orderDate,
        dueDate,
        product: product, 
        material:
          typeof material === "string" && material.trim()
            ? material.trim()
            : null,
        shade:
          typeof shade === "string" && shade.trim() ? shade.trim() : null,
        
        status: "IN_DESIGN", 
        stage: "DESIGN",    
        
        // NEW BILLING FIELDS
        units: unitCount,
        cost: cost,
        billingType: billingType,
        invoiced: false,
      },
      select: { id: true },
    });

    // Save scan viewer HTML under /public/uploads/<caseId>/<filename>
    const uploadsRoot = path.join(
      process.cwd(),
      "public",
      "uploads",
      created.id,
    );
    await fs.mkdir(uploadsRoot, { recursive: true });

    const safeName = sanitizeHtmlFileName(
      originalName,
      "scan_viewer.html",
    );
    
    // UPDATED: Write buffer directly, no translation injection
    const fullPath = path.join(uploadsRoot, safeName);
    await fs.writeFile(fullPath, scanBuf);

    const publicUrl = `/uploads/${created.id}/${safeName}`;

    await prisma.caseFile.create({
      data: {
        caseId: created.id,
        label: "scan_html",
        kind: "OTHER", 
        url: publicUrl,
        sizeBytes: scanBuf.length, // UPDATED: Use original buffer length
      },
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