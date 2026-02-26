// portal/app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFileStream } from "@/lib/storage";
import archiver from "archiver";
import path from "node:path";
import { Readable } from "stream";

function getFormattedDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

// Allow dots for shades like "A3.5", allow hyphens, strip others
function sanitize(str: string | null | undefined) {
  if (!str) return "";
  const safe = str.replace(/\//g, "-"); 
  return safe.replace(/[^a-zA-Z0-9.-]/g, "");
}

function toCamelCase(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function getOutputSuffix(dbLabel: string): string {
  const l = dbLabel.toLowerCase();
  if (l === "model_top") return "_ModelTop";
  if (l === "model_bottom") return "_ModelBottom";
  if (l === "rx_pdf") return "_RX";
  if (l === "design_only") return "_Design";
  if (l === "construction_info") return "_Design";
  return "_File";
}

// ✅ NEW: Helper to generate the Order Ticket Text
function generateOrderTicket(c: any): string {
  // 1. Clean up Product Name (Remove redundancy if product already contains material name)
  const rawProduct = c.product.replace(/_/g, " ");
  const rawMaterial = c.material ? c.material.replace(/_/g, " ") : "";
  
  let productDisplay = rawProduct;
  if (rawMaterial && !rawProduct.includes(rawMaterial)) {
      productDisplay += ` (${rawMaterial})`;
  }

  const isImplant = c.product.includes("IMPLANT");
  
  // 2. Extract retention type
  let retentionLine = "";
  if (isImplant) {
     const prefs = (c.doctorPreferences || "").toUpperCase();
     const retentionType = prefs.includes("SCREW RETAINED") ? "SCREW RETAINED" : 
                           prefs.includes("CEMENT RETAINED") ? "CEMENT RETAINED" : "SEE NOTES / UNKNOWN";
     retentionLine = `RETENTION:  ${retentionType}\n`;
  }

  // 3. Clean up Shade formatting (Only show what was actually requested)
  const shadeParts = [];
  if (c.shade) shadeParts.push(`Body: ${c.shade}`);
  if (c.shadeGingival) shadeParts.push(`Gingival: ${c.shadeGingival}`);
  if (c.shadeIncisal) shadeParts.push(`Incisal: ${c.shadeIncisal}`);
  
  const shadeDisplay = shadeParts.length > 0 ? shadeParts.join(" | ") : "None Required";

  return `=========================================
LUMERA DENTAL - PRODUCTION TICKET
=========================================
CASE ID:    ${c.id}
PATIENT:    ${c.patientAlias} (${c.patientFirstName || ""} ${c.patientLastName || ""})
DOCTOR:     ${c.doctorName || "Unknown Doctor"}
CLINIC:     ${c.clinic?.name || "Unknown Clinic"}
-----------------------------------------
PRODUCT:    ${productDisplay}
${retentionLine}TOOTH #:    ${c.toothCodes}
SHADE:      ${shadeDisplay}
-----------------------------------------
SHIP TO:
${c.clinic?.name || "Unknown Clinic"}
Attn: ${c.doctorName || "Doctor"}
${c.clinic?.address?.street || "No Street Provided"}
${c.clinic?.address?.city || "No City"}, ${c.clinic?.address?.state || ""} ${c.clinic?.address?.zipCode || ""}
=========================================
NOTES:
${c.doctorPreferences || "None"}
=========================================`;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "milling" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const cases = await prisma.dentalCase.findMany({
      where: { id: { in: ids } },
      include: {
        clinic: { include: { address: true } },
        files: true 
      }
    });

    // We now store a Buffer payload for dynamically generated text files alongside S3 keys
    const fileList: { key?: string; archivePath: string; isMock?: boolean; textPayload?: string }[] = [];
    
    const rootFolder = `Download_${getFormattedDate()}`;

    for (const c of cases) {
      const clinicName = sanitize(c.clinic.name) || "UnknownClinic";
      const zip = sanitize(c.clinic.address?.zipCode) || "NoZip";
      const routingFolder = `${clinicName}_${zip}`;

      const last = sanitize(c.patientLastName);
      const first = sanitize(c.patientFirstName);
      const type = toCamelCase(c.product); 
      let material = toCamelCase(c.material);
      const shade = sanitize(c.shade);

      if (type === "Emax" || type === "InlayOnlay") {
        material = "";
      }
      
      const caseFolderName = `${last}${first}_${shade}_${type}${material}`;
      const caseFolderPath = path.join(rootFolder, routingFolder, caseFolderName);

      // 1. Queue the STL/PDF Files
      const relevantLabels = [
        "model_top", 
        "model_bottom", 
        "rx_pdf", 
        "design_only", 
        "construction_info"
      ];

      for (const file of c.files) {
        if (!file.label || !relevantLabels.includes(file.label)) continue;

        const key = file.url;
        const alias = sanitize(c.patientAlias) || "UnknownAlias";
        const suffix = getOutputSuffix(file.label);
        
        let ext = path.extname(key);
        if (!ext && file.kind === "STL") ext = ".stl";
        if (file.label === "construction_info") ext = ".constructionInfo";

        const finalFileName = `${alias}${suffix}${ext}`;
        const archivePath = path.join(caseFolderPath, finalFileName);
        
        const isMock = key.startsWith("mock/");
        fileList.push({ key, archivePath, isMock });
      }

      // 2. ✅ Queue the Auto-Generated Order Ticket for THIS specific case
      const ticketContent = generateOrderTicket(c);
      fileList.push({
          archivePath: path.join(caseFolderPath, `Order_Ticket_${c.patientAlias}.txt`),
          textPayload: ticketContent
      });
    }

    if (fileList.length === 0) {
      return NextResponse.json({ error: "No production files found for selected cases" }, { status: 404 });
    }

    await prisma.dentalCase.updateMany({
      where: { 
        id: { in: ids },
        status: "APPROVED" 
      },
      data: {
        status: "IN_MILLING",
        stage: "MILLING_GLAZING",
        milledAt: new Date()
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.on("data", (chunk) => controller.enqueue(chunk));
        archive.on("end", () => controller.close());
        archive.on("error", (err) => controller.error(err));

        for (const f of fileList) {
          try {
            // ✅ Handle generated Text Files
            if (f.textPayload) {
                archive.append(f.textPayload, { name: f.archivePath });
                continue;
            }

            // Handle standard S3 / Mock files
            if (f.isMock) {
               archive.append(`Mock file content for ${f.archivePath}\n(Testing only)`, { name: f.archivePath });
            } else if (f.key) {
               const s3Stream = await getFileStream(f.key);
               archive.append(s3Stream as Readable, { name: f.archivePath });
            }
          } catch (e) {
            console.warn(`[Batch Download] Skipping missing file key: ${f.key}`, e);
            archive.append(`Error: File missing from storage.\nKey: ${f.key}`, { name: `${f.archivePath}.ERROR.txt` });
          }
        }
        await archive.finalize();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${rootFolder}.zip"`,
        "X-Accel-Buffering": "no",
      },
    });

  } catch (e) {
    console.error("Batch zip error:", e);
    return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
  }
}