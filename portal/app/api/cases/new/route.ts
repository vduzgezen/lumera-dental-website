// app/api/cases/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";

const MAX_SCAN_VIEWER_BYTES = 200 * 1024 * 1024; // 200MB

/** DentalCase may be named differently in Prisma client */
function getCaseModel(p: any) {
  return p.dentalCase ?? p.case ?? p.case_;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Sanitize an HTML filename:
 * - Replace spaces with underscores
 * - Keep/force .html or .htm extension
 * - Strip problematic URL chars like '#' and '?'
 */
function sanitizeHtmlFileName(original: string, fallbackBase: string): string {
  const baseName = (original || fallbackBase).replace(/\s+/g, "_");
  const lower = baseName.toLowerCase();

  let ext = ".html";
  if (lower.endsWith(".html")) {
    ext = ".html";
  } else if (lower.endsWith(".htm")) {
    ext = ".htm";
  }

  let nameWithoutExt = baseName;
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const idx = baseName.lastIndexOf(".");
    if (idx >= 0) {
      nameWithoutExt = baseName.slice(0, idx);
    }
  }

  const cleanedBase = nameWithoutExt.replace(/[?#]/g, "");
  return cleanedBase + ext;
}

/**
 * Normalize Exocad HTML text:
 * 1) Keep original content.
 * 2) Inject a small script that runs after load and translates
 *    common Turkish slider labels into English in the DOM.
 */
function normalizeExocadHtml(html: string): string {
  const script = `
<script>
(function() {
  var MAP = {
    "Antagonistler": "Antagonists",
    "Çene taramaları": "Jaw scans",
    "Çene taramaları": "Jaw scans",
    "Cene taramalari": "Jaw scans",
    "Çene taraması": "Jaw scan",
    "Tam anatomik": "Full anatomy",
    "Alt tasarım": "Lower design",
    "Alt tasarim": "Lower design",
    "Minimum kalınlık": "Minimum thickness",
    "Minimum kalinlik": "Minimum thickness",
    "Bütün çene": "Whole jaw",
    "Butun cene": "Whole jaw",
    "Dolgu boslugu": "Filling gap"
  };

  function translateNode(node) {
    if (!node) return;
    if (node.nodeType === 3) { // text
      var text = node.nodeValue || "";
      var changed = false;
      for (var key in MAP) {
        if (!Object.prototype.hasOwnProperty.call(MAP, key)) continue;
        if (text.indexOf(key) !== -1) {
          text = text.split(key).join(MAP[key]);
          changed = true;
        }
      }
      if (changed) {
        node.nodeValue = text;
      }
      return;
    }
    if (node.nodeType === 1 && node.childNodes && node.childNodes.length) {
      for (var i = 0; i < node.childNodes.length; i++) {
        translateNode(node.childNodes[i]);
      }
    }
  }

  function run() {
    try {
      translateNode(document.body);
    } catch (e) {
      console.error("Exocad translation script error:", e);
    }
  }

  window.addEventListener("load", function() {
    setTimeout(run, 500);
  });
})();
</script>
`;

  if (html.includes("</body>")) {
    return html.replace("</body>", script + "\n</body>");
  }
  return html + script;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    if (session.role === "customer") {
      return NextResponse.json(
        { error: "Only lab/admin can create cases." },
        { status: 403 },
      );
    }

    const form = await req.formData();

    const alias = form.get("patientAlias");
    const doctorUserId = form.get("doctorUserId");
    const toothCodes = form.get("toothCodes");
    const orderDateRaw = form.get("orderDate");
    const product = form.get("product");
    const material = form.get("material");
    const shade = form.get("shade");

    // Scan viewer HTML: prefer explicit field, fall back to "scan" for compatibility
    const scanViewerRaw = form.get("scanHtml") ?? form.get("scan");

    if (typeof alias !== "string" || !alias.trim()) {
      return NextResponse.json(
        { error: "Patient alias is required." },
        { status: 400 },
      );
    }
    if (typeof doctorUserId !== "string" || !doctorUserId) {
      return NextResponse.json(
        { error: "Doctor user id is required." },
        { status: 400 },
      );
    }
    if (typeof toothCodes !== "string" || !toothCodes.trim()) {
      return NextResponse.json(
        { error: "Tooth codes are required." },
        { status: 400 },
      );
    }
    if (typeof orderDateRaw !== "string") {
      return NextResponse.json(
        { error: "Order date missing or invalid." },
        { status: 400 },
      );
    }
    if (typeof product !== "string" || !product) {
      return NextResponse.json(
        { error: "Product is required." },
        { status: 400 },
      );
    }

    if (!(scanViewerRaw instanceof File)) {
      return NextResponse.json(
        { error: "Scan viewer HTML is required." },
        { status: 400 },
      );
    }

    const orderDate = new Date(orderDateRaw);
    if (Number.isNaN(orderDate.getTime())) {
      return NextResponse.json(
        { error: "Order date invalid." },
        { status: 400 },
      );
    }
    const dueDate = addDays(orderDate, 8);

    const doctor = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        clinicId: true,
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!doctor || doctor.role !== "customer") {
      return NextResponse.json(
        { error: "Doctor account not found." },
        { status: 400 },
      );
    }
    if (!doctor.clinicId || !doctor.clinic) {
      return NextResponse.json(
        { error: "Doctor has no clinic linked." },
        { status: 400 },
      );
    }

    // Validate scan viewer type and size
    const scanViewer = scanViewerRaw as File;
    const originalName = scanViewer.name || "scan_viewer.html";
    const lower = originalName.toLowerCase();
    if (!lower.endsWith(".html") && !lower.endsWith(".htm")) {
      return NextResponse.json(
        { error: "Scan viewer must be an HTML file." },
        { status: 400 },
      );
    }

    const scanBuf = Buffer.from(await scanViewer.arrayBuffer());
    if (scanBuf.length > MAX_SCAN_VIEWER_BYTES) {
      return NextResponse.json(
        { error: "Scan viewer file is too large." },
        { status: 400 },
      );
    }

    const caseModel = getCaseModel(prisma as any);

    const created = await caseModel.create({
      data: {
        clinicId: doctor.clinic.id,
        doctorUserId: doctor.id,
        patientAlias: alias.trim(),
        doctorName: doctor.name ?? null,
        toothCodes: toothCodes.trim(),
        orderDate,
        dueDate,
        product: product as any,
        material:
          typeof material === "string" && material.trim()
            ? material.trim()
            : null,
        shade:
          typeof shade === "string" && shade.trim() ? shade.trim() : null,
        status: "IN_DESIGN",
        stage: "DESIGN",
      } as any,
      select: { id: true },
    });

    // Save scan viewer HTML under /public/uploads/<caseId>/<filename>
    const uploadsRoot = path.join(
      process.cwd(),
      "public",
      "uploads",
      created.id,
    );
    await fs.mkdir(uploadsRoot, { recursive: true });

    const safeName = sanitizeHtmlFileName(
      originalName,
      "scan_viewer.html",
    );

    // Normalize content (inject DOM translator) before saving
    const htmlText = scanBuf.toString("utf8");
    const normalized = normalizeExocadHtml(htmlText);
    const finalBuf = Buffer.from(normalized, "utf8");

    const fullPath = path.join(uploadsRoot, safeName);
    await fs.writeFile(fullPath, finalBuf);

    const publicUrl = `/uploads/${created.id}/${safeName}`;

    await prisma.caseFile.create({
      data: {
        caseId: created.id,
        label: "scan_html",
        kind: "OTHER" as any,
        url: publicUrl,
        sizeBytes: finalBuf.length,
      } as any,
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("Create case error:", err);
    return NextResponse.json(
      { error: "Something went wrong creating the case." },
      { status: 500 },
    );
  }
}
