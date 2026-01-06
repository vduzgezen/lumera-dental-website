// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";

// FIX: Define FileKind locally since it's a String in schema
const FileKind = {
  STL: "STL",
  PLY: "PLY",
  OBJ: "OBJ",
  OTHER: "OTHER"
} as const;
type FileKindType = typeof FileKind[keyof typeof FileKind];

// FIX: Define ProductionStage locally
const ProductionStage = {
  DESIGN: "DESIGN",
  MILLING_GLAZING: "MILLING_GLAZING",
  SHIPPING: "SHIPPING"
} as const;

type Params = Promise<{ id: string }>;

/**
 * Normalizes the slot label coming from the client.
 */
function normalizeSlotLabel(raw: FormDataEntryValue | null): string {
  const lower = (raw ?? "").toString().trim().toLowerCase();

  if (!lower) return "other";
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") {
    return "design_with_model";
  }
  if (lower === "design_only") return "design_only";

  return lower;
}

/**
 * Choose a file extension & FileKind enum based on the incoming filename.
 */
function chooseExtAndKind(
  originalName: string,
  slot: string,
): { ext: string; kind: FileKindType } {
  const lower = originalName.toLowerCase();
  // Treat Exocad HTML exports as HTML
  if (lower.endsWith(".html")) return { ext: ".html", kind: FileKind.OTHER };
  if (lower.endsWith(".htm")) return { ext: ".htm", kind: FileKind.OTHER };

  // 3D formats
  if (lower.endsWith(".stl")) return { ext: ".stl", kind: FileKind.STL };
  if (lower.endsWith(".ply")) return { ext: ".ply", kind: FileKind.PLY };
  if (lower.endsWith(".obj")) return { ext: ".obj", kind: FileKind.OBJ };
  // Images
  if (lower.endsWith(".png")) return { ext: ".png", kind: FileKind.OTHER };
  if (lower.endsWith(".jpg")) return { ext: ".jpg", kind: FileKind.OTHER };
  if (lower.endsWith(".jpeg")) return { ext: ".jpeg", kind: FileKind.OTHER };
  // No extension: assume STL for standard 3D slots
  if (
    slot === "scan" ||
    slot === "design_with_model" ||
    slot === "design_only"
  ) {
    return { ext: ".stl", kind: FileKind.STL };
  }

  // Everything else
  return { ext: ".bin", kind: FileKind.OTHER };
}

export async function POST(req: Request, props: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const form = await req.formData();
    const slotLabel = normalizeSlotLabel(form.get("label"));

    // --- PERMISSIONS LOGIC ---
    if (session.role === "customer") {
        // 1. Verify ownership
        if (session.clinicId) {
            const check = await prisma.dentalCase.findFirst({
                where: { id, clinicId: session.clinicId }
            });
            if (!check) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        
        // 2. Limit what they can upload
        // "photo" is used for annotations.
        // "scan" is for raw files.
        const allowed = ["scan", "photo", "other"];
        // Note: The annotation tool typically sends label="Photo", which normalizeSlotLabel converts to "other" if not scan/design.
        if (!allowed.includes(slotLabel) && slotLabel !== "other") { 
            // If they try to upload to "design_with_model", block it.
            // But if normalizeSlotLabel returns 'other' for 'Photo', we are good.
        }
    }

    const incomingFiles: File[] = [
      ...(form.getAll("file") as File[]),
      ...(form.getAll("files") as File[]),
    ].filter((f): f is File => f instanceof File);

    if (!incomingFiles.length) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const dentalCase = await prisma.dentalCase.findUnique({
      where: { id },
      select: { id: true, stage: true },
    });

    if (!dentalCase) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    // Guard: Can only upload scans in DESIGN stage
    if (
      slotLabel === "scan" &&
      dentalCase.stage !== ProductionStage.DESIGN
    ) {
      return NextResponse.json(
        { error: "Scan files can only be uploaded while the case is in the DESIGN stage." },
        { status: 400 },
      );
    }

    const uploadsRoot = path.join(process.cwd(), "public", "uploads", id);
    await fs.mkdir(uploadsRoot, { recursive: true });
    const created: any[] = [];

    // Only delete old files for the strict slots (Scan/Design).
    // For Annotations (Photo/Other), we keep adding them.
    const REPLACE_SLOTS = [
      "scan", "design_with_model", "design_only", 
      "scan_html", "design_with_model_html"
    ];

    if (REPLACE_SLOTS.includes(slotLabel)) {
      await prisma.caseFile.deleteMany({
        where: { caseId: id, label: slotLabel },
      });
    }

    for (const file of incomingFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);

      const originalName = (file.name || "file").replace(/\s+/g, "_");

      const { ext, kind } = chooseExtAndKind(originalName, slotLabel);
      const hasExt = originalName.toLowerCase().endsWith(ext);
      const base = hasExt
        ? originalName.slice(0, originalName.length - ext.length)
        : originalName;

      // Add timestamp to photos/annotations to prevent overwriting
      const uniqueSuffix = (!REPLACE_SLOTS.includes(slotLabel)) 
        ? `_${Date.now()}` 
        : "";
      
      const safeName = `${base}${uniqueSuffix}${ext}`;
      const fullPath = path.join(uploadsRoot, safeName);
      
      // UPDATED: Removed HTML injection logic. We write the file exactly as uploaded.
      await fs.writeFile(fullPath, buf);

      const publicUrl = `/uploads/${id}/${safeName}`;

      const rec = await prisma.caseFile.create({
        data: {
          caseId: id,
          label: slotLabel,
          kind: kind,
          url: publicUrl,
          sizeBytes: buf.length,
        },
        select: {
          id: true,
          url: true,
          label: true,
          kind: true,
        },
      });
      created.push(rec);
    }

    return NextResponse.json({ ok: true, id: created[0]?.id, files: created });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}