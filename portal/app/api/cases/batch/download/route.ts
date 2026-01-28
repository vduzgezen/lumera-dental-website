// portal/app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

function getFormattedDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

// ✅ FIX: Allow 'undefined' in the type definition
function sanitize(str: string | null | undefined) {
  // If null, undefined, or empty, return empty string
  if (!str) return "";
  return str.replace(/[^a-zA-Z0-9]/g, "");
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
  if (l === "design_only" || l === "design_with_model") return "_Design";
  if (l === "construction_info") return "_Design"; 
  return "_File";
}

function zipFiles(files: { diskPath: string; archivePath: string }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", reject);
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    files.forEach((f) => {
      if (fs.existsSync(f.diskPath)) {
        archive.file(f.diskPath, { name: f.archivePath });
      }
    });

    archive.finalize();
  });
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
        clinic: {
          include: { address: true }
        },
        files: true 
      }
    });

    const fileList: { diskPath: string; archivePath: string }[] = [];
    const rootFolder = `Download_${getFormattedDate()}`;

    for (const c of cases) {
      // 1. Routing Folder
      const clinicName = sanitize(c.clinic.name) || "UnknownClinic";
      
      // ✅ FIX: Safe access with optional chaining now works because sanitize accepts undefined
      const zip = sanitize(c.clinic.address?.zipCode) || "NoZip";
      const routingFolder = `${clinicName}_${zip}`;

      // 2. Case Attributes
      const last = sanitize(c.patientLastName);
      const first = sanitize(c.patientFirstName);
      
      // CamelCase Conversion
      const type = toCamelCase(c.product); 
      let material = toCamelCase(c.material); 
      const shade = sanitize(c.shade); 

      // Exception Logic
      if (type === "Emax" || type === "InlayOnlay") {
        material = ""; 
      }
      
      // Build Folder Name: LastNameFirstNameShadeTypeMaterial
      const caseFolderName = `${last}${first}${shade}${type}${material}`;

      const relevantLabels = ["model_top", "model_bottom", "rx_pdf", "design_only", "design_with_model", "construction_info"];
      
      for (const file of c.files) {
        if (!file.label || !relevantLabels.includes(file.label)) continue;

        const relativePath = file.url.replace(/^\//, "");
        const diskPath = path.join(process.cwd(), "public", relativePath);
        
        // Naming
        const alias = sanitize(c.patientAlias) || "UnknownAlias";
        const suffix = getOutputSuffix(file.label);
        
        let ext = path.extname(diskPath);
        if (file.label === "construction_info") {
            ext = ".constructionInfo"; 
        }

        const finalFileName = `${alias}${suffix}${ext}`;
        const archivePath = path.join(rootFolder, routingFolder, caseFolderName, finalFileName);

        fileList.push({ diskPath, archivePath });
      }
    }

    if (fileList.length === 0) {
      return NextResponse.json({ error: "No production files found for selected cases" }, { status: 404 });
    }

    const buffer = await zipFiles(fileList);

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

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${rootFolder}.zip"`
      }
    });

  } catch (e) {
    console.error("Batch zip error:", e);
    return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
  }
}