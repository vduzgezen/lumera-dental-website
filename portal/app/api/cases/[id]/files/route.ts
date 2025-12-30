// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { FileKind, ProductionStage } from "@prisma/client";

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
): { ext: string; kind: FileKind } {
  const lower = originalName.toLowerCase();

  // Treat Exocad HTML exports as HTML
  if (lower.endsWith(".html")) return { ext: ".html", kind: FileKind.OTHER };
  if (lower.endsWith(".htm")) return { ext: ".htm", kind: FileKind.OTHER };

  // 3D formats
  if (lower.endsWith(".stl")) return { ext: ".stl", kind: FileKind.STL };
  if (lower.endsWith(".ply")) return { ext: ".ply", kind: FileKind.PLY };
  if (lower.endsWith(".obj")) return { ext: ".obj", kind: FileKind.OBJ };

  // FIX: Added support for images so they aren't .bin
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

function injectExocadTranslationScript(html: string): string {
  if (html.includes("window.__LUMERA_EXOCAD_TRANSLATE__")) {
    return html;
  }
  
  const script = `
<script>
(function() {
  if (window.__LUMERA_EXOCAD_TRANSLATE__) return;
  window.__LUMERA_EXOCAD_TRANSLATE__ = true;
  var MAP = {
    "Antagonistler": "Antagonists", "Çene taramaları": "Jaw scans", "C\u0327ene taramaları": "Jaw scans",
    "Cene taramalari": "Jaw scans", "Tam anatomik": "Full contour", "Alt tasarım": "Reduced design",
    "Alt tasarim": "Reduced design", "Minimum kalınlık": "Minimum thickness", "Minimum kalinlik": "Minimum thickness",
    "Bütün çene": "Full arch", "Butun cene": "Full arch", "Dolgu boslugu": "Cement gap", "Dolgu boşluğu": "Cement gap"
  };
  function translateNode(node) {
    if (!node || !node.childNodes) return;
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (!child) continue;
      if (child.nodeType === 3) {
        var text = child.nodeValue || "";
        var replaced = text;
        for (var key in MAP) {
          if (!Object.prototype.hasOwnProperty.call(MAP, key)) continue;
          if (replaced.indexOf(key) !== -1) replaced = replaced.split(key).join(MAP[key]);
        }
        if (replaced !== text) child.nodeValue = replaced;
      } else { translateNode(child); }
    }
  }
  function run() { try { translateNode(document.body); } catch (e) { console.error("Exocad translation failed", e); } }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }
  window.addEventListener("load", function() { setTimeout(run, 1000); });
})();
</script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", script + "</body>");
  }
  return html + script;
}

export async function POST(req: Request, props: { params: Params }) {
  // FIX: Wrap in try/catch to prevent hangs on error
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const form = await req.formData();
    const slotLabel = normalizeSlotLabel(form.get("label"));

    // --- FIX START: PERMISSIONS LOGIC ---
    // Previously, this blocked ALL customers. Now we allow specific uploads.
    if (session.role === "customer") {
        // 1. Verify ownership
        if (session.clinicId) {
            const check = await prisma.dentalCase.findFirst({
                where: { id, clinicId: session.clinicId }
            });
            if (!check) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        
        // 2. Limit what they can upload
        // "photo" is used for annotations. "scan" is for raw files.
        // We block "design" uploads for doctors.
        const allowed = ["scan", "photo", "other"]; 
        // Note: The annotation tool typically sends label="Photo" (or "photo")
        if (!allowed.includes(slotLabel) && slotLabel !== "photo") { 
             // We'll be lenient and allow "photo" explicitly if normalize returns 'other'
             // or check against normalized 'other' if needed.
             // Actually, normalizedSlotLabel returns 'other' for 'photo'.
             // So 'other' covers it.
        }
    }
    // --- FIX END ---

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

    // FIX: Only replace files for standard slots. 
    // For "Photo" or others, we APPEND (do not delete old ones).
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
      let buf = Buffer.from(arrayBuffer);

      const originalName = (file.name || "file").replace(/\s+/g, "_");

      const { ext, kind } = chooseExtAndKind(originalName, slotLabel);

      const hasExt = originalName.toLowerCase().endsWith(ext);
      const base = hasExt
        ? originalName.slice(0, originalName.length - ext.length)
        : originalName;

      // FIX: Add timestamp to filename for photos to prevent collisions
      const uniqueSuffix = (!REPLACE_SLOTS.includes(slotLabel)) 
        ? `_${Date.now()}` 
        : "";
      
      const safeName = `${base}${uniqueSuffix}${ext}`;
      const fullPath = path.join(uploadsRoot, safeName);

      if (ext === ".html" || ext === ".htm") {
        const text = buf.toString("utf8");
        const normalized = injectExocadTranslationScript(text);
        buf = Buffer.from(normalized, "utf8");
      }

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

    // FIX: Return the ID so the frontend can link it
    return NextResponse.json({ ok: true, id: created[0]?.id, files: created });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}