// portal/app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage"; // ✅ NEW

const FileKind = {
  STL: "STL",
  PLY: "PLY",
  OBJ: "OBJ",
  PDF: "PDF", 
  OTHER: "OTHER"
} as const;
type FileKindType = typeof FileKind[keyof typeof FileKind];

const ProductionStage = {
  DESIGN: "DESIGN",
  MILLING_GLAZING: "MILLING_GLAZING",
  SHIPPING: "SHIPPING"
} as const;

type Params = Promise<{ id: string }>;

function normalizeSlotLabel(raw: FormDataEntryValue | null): string {
  const lower = (raw ?? "").toString().trim().toLowerCase();
  if (!lower) return "other";
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") return "design_with_model";
  if (lower === "design_only") return "design_only";
  return lower;
}

function chooseExtAndKind(
  originalName: string,
  slot: string,
): { ext: string; kind: FileKindType } {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".html")) return { ext: ".html", kind: FileKind.OTHER };
  if (lower.endsWith(".htm")) return { ext: ".htm", kind: FileKind.OTHER };
  if (lower.endsWith(".stl")) return { ext: ".stl", kind: FileKind.STL };
  if (lower.endsWith(".ply")) return { ext: ".ply", kind: FileKind.PLY };
  if (lower.endsWith(".obj")) return { ext: ".obj", kind: FileKind.OBJ };
  if (lower.endsWith(".pdf")) return { ext: ".pdf", kind: FileKind.PDF };
  if (lower.endsWith(".constructioninfo")) return { ext: ".constructionInfo", kind: FileKind.OTHER };
  if (lower.endsWith(".xml")) return { ext: ".xml", kind: FileKind.OTHER };
  if (lower.endsWith(".txt")) return { ext: ".txt", kind: FileKind.OTHER };
  if (lower.endsWith(".png")) return { ext: ".png", kind: FileKind.OTHER };
  if (lower.endsWith(".jpg")) return { ext: ".jpg", kind: FileKind.OTHER };
  if (lower.endsWith(".jpeg")) return { ext: ".jpeg", kind: FileKind.OTHER };
  if (slot === "scan" || slot === "design_with_model" || slot === "design_only") {
    return { ext: ".stl", kind: FileKind.STL };
  }
  return { ext: ".bin", kind: FileKind.OTHER };
}

export async function POST(req: Request, props: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await props.params;
    let form: FormData;
    try {
        form = await req.formData();
    } catch (e) {
        console.error("FormData parse error:", e);
        return NextResponse.json({ error: "Failed to upload. File might be too large." }, { status: 400 });
    }

    const slotLabel = normalizeSlotLabel(form.get("label"));

    if (session.role === "customer") {
        if (session.clinicId) {
            const check = await prisma.dentalCase.findFirst({
                where: { id, clinicId: session.clinicId }
            });
            if (!check) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const allowed = ["scan", "photo", "other"];
        if (!allowed.includes(slotLabel) && slotLabel !== "other") { 
            // Block logic if needed
        }
    }

    const incomingFiles: File[] = [
      ...(form.getAll("file") as File[]),
      ...(form.getAll("files") as File[]),
    ].filter((f): f is File => f instanceof File);

    if (!incomingFiles.length) return NextResponse.json({ error: "No files uploaded." }, { status: 400 });

    const dentalCase = await prisma.dentalCase.findUnique({
      where: { id },
      select: { id: true, stage: true },
    });
    if (!dentalCase) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    if (slotLabel === "scan" && dentalCase.stage !== ProductionStage.DESIGN) {
      return NextResponse.json(
        { error: "Scan files can only be uploaded while the case is in the DESIGN stage." },
        { status: 400 },
      );
    }

    const created: any[] = [];
    const REPLACE_SLOTS = ["scan", "design_with_model", "design_only", "scan_html", "design_with_model_html"];
    
    if (REPLACE_SLOTS.includes(slotLabel)) {
      await prisma.caseFile.deleteMany({
        where: { caseId: id, label: slotLabel },
      });
    }

    for (const file of incomingFiles) {
      const buf = Buffer.from(await file.arrayBuffer());
      const originalName = (file.name || "file").replace(/\s+/g, "_");
      
      const { ext, kind } = chooseExtAndKind(originalName, slotLabel);
      const hasExt = originalName.toLowerCase().endsWith(ext.toLowerCase());
      const base = hasExt ? originalName.slice(0, originalName.length - ext.length) : originalName;
      
      const uniqueSuffix = (!REPLACE_SLOTS.includes(slotLabel)) ? `_${Date.now()}` : "";
      const safeName = `${base}${uniqueSuffix}${ext}`;
      
      // ✅ S3 Key Pattern
      const key = `cases/${id}/${slotLabel}_${safeName}`;

      // ✅ Upload to S3
      await uploadFile(buf, key, file.type || "application/octet-stream");

      const rec = await prisma.caseFile.create({
        data: {
          caseId: id,
          label: slotLabel,
          kind: kind,
          url: key, // Store KEY
          sizeBytes: buf.length,
        },
        select: { id: true, url: true, label: true, kind: true },
      });
      created.push(rec);
    }

    return NextResponse.json({ ok: true, id: created[0]?.id, files: created });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}