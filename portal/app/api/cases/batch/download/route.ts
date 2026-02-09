// portal/app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFileStream } from "@/lib/storage";
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

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "milling" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // 1. Fetch Metadata
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

    // 2. Build File List (Same logic as before)
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
      
      const caseFolderName = `${last}${first}${shade}${type}${material}`;
      const relevantLabels = ["model_top", "model_bottom", "rx_pdf", "design_only", "design_with_model", "construction_info"];

      for (const file of c.files) {
        if (!file.label || !relevantLabels.includes(file.label)) continue;

        const key = file.url;
        const alias = sanitize(c.patientAlias) || "UnknownAlias";
        const suffix = getOutputSuffix(file.label);
        
        let ext = path.extname(key);
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

    // 3. Update DB Status *Before* Streaming
    // We do this first because once the stream starts, we can't easily "un-send" headers.
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

    // 4. Create Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        // Create Archiver instance
        const archive = archiver("zip", { zlib: { level: 9 } });

        // Pipe Archiver output -> Controller (Client)
        archive.on("data", (chunk) => controller.enqueue(chunk));
        archive.on("end", () => controller.close());
        archive.on("error", (err) => controller.error(err));

        // Process files one by one (Async iteration)
        for (const f of fileList) {
          try {
            const s3Stream = await getFileStream(f.key);
            // Append S3 stream to Archive
            archive.append(s3Stream as Readable, { name: f.archivePath });
          } catch (e) {
            console.warn(`[Batch Download] Skipping missing file key: ${f.key}`, e);
            // We intentionally continue so one missing file doesn't kill the whole batch
          }
        }

        // Finalize (This triggers the 'end' event above)
        await archive.finalize();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${rootFolder}.zip"`,
        // Disable buffering on Vercel/proxies to ensure streaming works
        "X-Accel-Buffering": "no",
      },
    });

  } catch (e) {
    console.error("Batch zip error:", e);
    return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
  }
}