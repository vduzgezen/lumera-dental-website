// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";
import { FileKind, ProductionStage } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * Normalizes the slot label coming from the client ("scan",
 * "design_with_model", "design_only") into what we store in
 * CaseFile.label.
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
 * Choose a file extension & FileKind enum based on the incoming
 * filename and slot.
 */
function chooseExtAndKind(
  originalName: string,
  slot: string,
): { ext: string; kind: FileKind } {
  const lower = originalName.toLowerCase();

  // Treat Exocad HTML exports as HTML, not STL
  if (lower.endsWith(".html")) {
    return { ext: ".html", kind: FileKind.OTHER };
  }
  if (lower.endsWith(".htm")) {
    return { ext: ".htm", kind: FileKind.OTHER };
  }

  // 3D formats
  if (lower.endsWith(".stl")) return { ext: ".stl", kind: FileKind.STL };
  if (lower.endsWith(".ply")) return { ext: ".ply", kind: FileKind.PLY };
  if (lower.endsWith(".obj")) return { ext: ".obj", kind: FileKind.OBJ };

  // No extension: assume STL for 3D slots
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

/**
 * Inject a tiny DOM-level translator for Exocad HTML viewers.
 */
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
    "Antagonistler": "Antagonists",
    "Çene taramaları": "Jaw scans",
    "C\u0327ene taramaları": "Jaw scans",
    "Cene taramalari": "Jaw scans",
    "Tam anatomik": "Full contour",
    "Alt tasarım": "Reduced design",
    "Alt tasarim": "Reduced design",
    "Minimum kalınlık": "Minimum thickness",
    "Minimum kalinlik": "Minimum thickness",
    "Bütün çene": "Full arch",
    "Butun cene": "Full arch",
    "Dolgu boslugu": "Cement gap",
    "Dolgu boşluğu": "Cement gap"
  };

  function translateNode(node) {
    if (!node || !node.childNodes) return;
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (!child) continue;

      if (child.nodeType === 3) { // text node
        var text = child.nodeValue || "";
        if (!text) continue;
        var replaced = text;
        for (var key in MAP) {
          if (!Object.prototype.hasOwnProperty.call(MAP, key)) continue;
          if (replaced.indexOf(key) !== -1) {
            replaced = replaced.split(key).join(MAP[key]);
          }
        }
        if (replaced !== text) {
          child.nodeValue = replaced;
        }
      } else {
        translateNode(child);
      }
    }
  }

  function run() {
    try {
      translateNode(document.body);
    } catch (e) {
      console.error("Exocad translation failed", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  window.addEventListener("load", function() {
    setTimeout(run, 1000);
  });
})();
</script>
`;

  if (html.includes("</body>")) {
    return html.replace("</body>", script + "</body>");
  }
  return html + script;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only lab/admin can upload files
  if (session.role === "customer") {
    return NextResponse.json(
      { error: "Only lab/admin may upload files." },
      { status: 403 },
    );
  }

  const { id } = await params;

  const form = await req.formData();
  const slotLabel = normalizeSlotLabel(form.get("label"));

  // Support both "file" and "files" keys
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

  // Business rule: scan HTML can only be replaced while in DESIGN stage
  if (
    slotLabel === "scan" &&
    dentalCase.stage !== ProductionStage.DESIGN
  ) {
    return NextResponse.json(
      {
        error:
          "Scan files can only be uploaded while the case is in the DESIGN stage.",
      },
      { status: 400 },
    );
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads", id);
  await fs.mkdir(uploadsRoot, { recursive: true });

  const created: any[] = [];

  // One file per slot: remove existing records for this slot on this case
  await prisma.caseFile.deleteMany({
    where: { caseId: id, label: slotLabel },
  });

  for (const file of incomingFiles) {
    const arrayBuffer = await file.arrayBuffer();
    let buf = Buffer.from(arrayBuffer);

    const originalName = (file.name || "file").replace(/\s+/g, "_");

    // This respects .html / .htm and keeps them as HTML
    const { ext, kind } = chooseExtAndKind(originalName, slotLabel);

    const hasExt = originalName.toLowerCase().endsWith(ext);
    const base = hasExt
      ? originalName.slice(0, originalName.length - ext.length)
      : originalName;

    const safeName = `${base}${ext}`;
    const fullPath = path.join(uploadsRoot, safeName);

    // If this is an HTML viewer, inject the translation helper
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

  return NextResponse.json({ ok: true, files: created });
}