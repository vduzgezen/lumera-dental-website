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

// ✅ Allow dots for shades like "A3.5", allow hyphens, strip others
function sanitize(str: string | null | undefined) {
  if (!str) return "";
  const safe = str.replace(/\//g, "-"); // Replace slashes with hyphens (e.g. A2/A3 -> A2-A3)
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
  if (l === "design_only") return "_Design"; // ✅ Only design_only gets _Design.stl
  if (l === "construction_info") return "_Design"; // Matches suffix but gets .constructionInfo extension below
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

    const cases = await prisma.dentalCase.findMany({
      where: { id: { in: ids } },
      include: {
        clinic: { include: { address: true } },
        files: true 
      }
    });

    const fileList: { key: string; archivePath: string; isMock?: boolean }[] = [];
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
      
      // ✅ FORMAT: DoeJohn_A5-A2-A2_ZirconiaMl
      const caseFolderName = `${last}${first}_${shade}_${type}${material}`;
      
      // ✅ UPDATED: Removed 'design_with_model' and 'scan'
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
        const archivePath = path.join(rootFolder, routingFolder, caseFolderName, finalFileName);
        
        const isMock = key.startsWith("mock/");
        fileList.push({ key, archivePath, isMock });
      }
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
            if (f.isMock) {
               // ✅ Support for mock testing files
               archive.append(`Mock file content for ${f.archivePath}\n(Testing only)`, { name: f.archivePath });
            } else {
               const s3Stream = await getFileStream(f.key);
               archive.append(s3Stream as Readable, { name: f.archivePath });
            }
          } catch (e) {
            console.warn(`[Batch Download] Skipping missing file key: ${f.key}`, e);
            // Insert placeholder error file so the technician knows a file was expected but missing
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