// portal/app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFileStream } from "@/lib/storage"; // ✅ Import cloud stream
import archiver from "archiver";
import path from "node:path";
import { Readable } from "stream";

// Helper: Format Date for folder name
function getFormattedDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function sanitize(str: string | null | undefined) {
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

// ✅ NEW: Zip Cloud Streams instead of Local Files
async function zipCloudFiles(files: { key: string; archivePath: string }[]): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 9 } });

  // Create a promise that resolves when the zip is fully built
  const streamPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on("error", reject);
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Iterate through requested files and pull them from Cloudflare
  for (const f of files) {
    try {
      // 1. Get stream from R2
      const s3Stream = await getFileStream(f.key);
      
      // 2. Pipe into Zip
      // 'as Readable' is safe here for Node.js runtime
      archive.append(s3Stream as Readable, { name: f.archivePath });
    } catch (e) {
      console.warn(`[Batch Download] Skipping missing file key: ${f.key}`, e);
      // We skip missing files so the zip still succeeds with what we have
    }
  }

  await archive.finalize();
  return streamPromise;
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

    const fileList: { key: string; archivePath: string }[] = [];
    const rootFolder = `Download_${getFormattedDate()}`;

    for (const c of cases) {
      // 1. Routing Folder
      const clinicName = sanitize(c.clinic.name) || "UnknownClinic";
      const zip = sanitize(c.clinic.address?.zipCode) || "NoZip";
      const routingFolder = `${clinicName}_${zip}`;

      // 2. Case Attributes
      const last = sanitize(c.patientLastName);
      const first = sanitize(c.patientFirstName);
      
      const type = toCamelCase(c.product); 
      let material = toCamelCase(c.material);
      const shade = sanitize(c.shade); 

      if (type === "Emax" || type === "InlayOnlay") {
        material = "";
      }
      
      // Build Folder Name
      const caseFolderName = `${last}${first}${shade}${type}${material}`;

      // 3. Select Relevant Files
      const relevantLabels = ["model_top", "model_bottom", "rx_pdf", "design_only", "design_with_model", "construction_info"];
      
      for (const file of c.files) {
        if (!file.label || !relevantLabels.includes(file.label)) continue;

        // ✅ KEY CHANGE: file.url IS the S3 Key now (e.g. cases/123/file.stl)
        const key = file.url; 
        
        // Naming logic
        const alias = sanitize(c.patientAlias) || "UnknownAlias";
        const suffix = getOutputSuffix(file.label);
        
        // Determine extension
        let ext = path.extname(key); // Extracts .stl from the key
        if (!ext && file.kind === "STL") ext = ".stl";
        if (file.label === "construction_info") ext = ".constructionInfo";

        const finalFileName = `${alias}${suffix}${ext}`;
        const archivePath = path.join(rootFolder, routingFolder, caseFolderName, finalFileName);

        fileList.push({ key, archivePath });
      }
    }

    if (fileList.length === 0) {
      return NextResponse.json({ error: "No production files found for selected cases" }, { status: 404 });
    }

    // ✅ Generate Zip from Cloud Streams
    const buffer = await zipCloudFiles(fileList);

    // Auto-update status
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