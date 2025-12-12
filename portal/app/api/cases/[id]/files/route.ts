// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";

// Small helper: keep extension, clean base (no spaces, #, ?)
function sanitizeFileName(original: string): string {
  // Replace spaces with underscores
  const noSpaces = original.replace(/\s+/g, "_");

  const lastDot = noSpaces.lastIndexOf(".");
  if (lastDot === -1) {
    // No extension – just strip bad chars from whole string
    return noSpaces.replace(/[?#]/g, "");
  }

  const base = noSpaces.slice(0, lastDot);
  const ext = noSpaces.slice(lastDot); // includes the "."

  // Remove URL-fragment-ish characters from the base
  const cleanedBase = base.replace(/[?#]/g, "");

  return cleanedBase + ext;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ⬅️ Next.js 15: params is async
  const { id } = await ctx.params;

  const form = await req.formData();

  // Your client currently uses "files", but we also accept "file" as a fallback.
  let files = form.getAll("files");
  if (!files || files.length === 0) {
    files = form.getAll("file");
  }

  const label = (form.get("label") as string) || "OTHER"; // e.g. "scan", "design_with_model", "design_only"
  const kind = (form.get("kind") as string) || "OTHER";   // optional extra enum if you’re using it

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const item = await prisma.dentalCase.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // (Optional) Stage rule – currently only wired for label === "SCAN"
  if (label === "SCAN" && item.stage !== "DESIGN") {
    return NextResponse.json(
      { error: "Scan cannot be replaced after DESIGN stage" },
      { status: 400 }
    );
  }

  const root = path.join(process.cwd(), "public", "uploads", id);
  await fs.mkdir(root, { recursive: true });

  const created: any[] = [];

  for (const f of files) {
    // @ts-ignore - File type from Web FormData
    const file = f as File;
    const arr = await file.arrayBuffer();
    const buf = Buffer.from(arr);

    // ✅ Sanitize: keep extension (.stl/.ply/.obj), remove `#` etc from base
    const safeName = sanitizeFileName(file.name || "file");
    const fullpath = path.join(root, safeName);
    await fs.writeFile(fullpath, buf);

    const publicUrl = `/uploads/${id}/${safeName}`;

    // ✅ One file per slot/label: replace existing entries
    await prisma.caseFile.deleteMany({ where: { caseId: id, label } });

    const kindAny = kind as any;
    const rec = await prisma.caseFile.create({
      data: {
        caseId: id,
        label,
        kind: kindAny,
        url: publicUrl,
        sizeBytes: buf.length,
      },
      select: { id: true, url: true, label: true, kind: true },
    });

    created.push(rec);
  }

  return NextResponse.json({ ok: true, files: created });
}
