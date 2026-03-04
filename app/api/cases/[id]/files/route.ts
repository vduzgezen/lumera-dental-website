// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

function normalizeSlotLabel(raw: string | null): string {
  const lower = (raw ?? "").toString().trim().toLowerCase();
  if (!lower) return "other";
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") return "design_with_model";
  if (lower === "design_only") return "design_only";
  // ✅ Allow dynamic design slots for individual teeth
  if (lower.startsWith("design_stl_")) return lower;
  return lower;
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await props.params;
    const body = await req.json(); 
    const { key, label: rawLabel, size, filename } = body;

    if (!key || !rawLabel) {
      return NextResponse.json({ error: "Missing file metadata" }, { status: 400 });
    }

    const slotLabel = normalizeSlotLabel(rawLabel);

    // Case Existence & Stage Check
    const dentalCase = await prisma.dentalCase.findUnique({
      where: { id },
      select: { id: true, stage: true, clinicId: true, doctorUserId: true },
    });

    if (!dentalCase) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    // Doctor Ownership Validation
    if (session.role === "customer") {
        const isOwner = dentalCase.doctorUserId === session.userId;
        const isSameClinic = session.clinicId && dentalCase.clinicId === session.clinicId;

        if (!isOwner && !isSameClinic) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // Stage Validation (Scan only in DESIGN)
    if (slotLabel === "scan" && dentalCase.stage !== ProductionStage.DESIGN) {
      return NextResponse.json(
        { error: "Scan files can only be uploaded while the case is in the DESIGN stage." },
        { status: 400 },
      );
    }

    // Determine File Kind
    const ext = filename.split('.').pop()?.toLowerCase();
    let kind: FileKindType = FileKind.OTHER;
    if (ext === 'stl') kind = FileKind.STL;
    else if (ext === 'ply') kind = FileKind.PLY;
    else if (ext === 'obj') kind = FileKind.OBJ;
    else if (ext === 'pdf') kind = FileKind.PDF;

    // Replacement Logic (Delete old DB record for this slot)
    const REPLACE_SLOTS = ["scan", "design_with_model", "design_only", "scan_html", "design_with_model_html", "rx_pdf"];
    
    // ✅ Allow dynamic slots to be replaced
    if (REPLACE_SLOTS.includes(slotLabel) || slotLabel.startsWith("design_stl_")) {
      await prisma.caseFile.deleteMany({
        where: { caseId: id, label: slotLabel },
      });
    }

    // Create the DB record
    const record = await prisma.caseFile.create({
      data: {
        caseId: id,
        label: slotLabel,
        kind: kind, 
        url: key, 
        sizeBytes: size,
      },
    });

    return NextResponse.json({ ok: true, id: record.id });

  } catch (error) {
    console.error("File record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}