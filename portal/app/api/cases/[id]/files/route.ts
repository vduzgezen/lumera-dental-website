// app/api/cases/[id]/files/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs/promises";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ⬅️ Next.js 15: params is async
  const { id } = await ctx.params;

  const form = await req.formData();
  const files = form.getAll("file");
  const label = (form.get("label") as string) || "OTHER"; // SCAN | MODEL_PLUS_DESIGN | DESIGN_ONLY
  const kind = (form.get("kind") as string) || "OTHER";   // Your enum mapping if needed

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const item = await prisma.dentalCase.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Business rule: allow replacing SCAN only while in DESIGN stage (adjust if needed)
  if (label === "SCAN" && item.stage !== "DESIGN") {
    return NextResponse.json({ error: "Scan cannot be replaced after DESIGN stage" }, { status: 400 });
  }

  const root = path.join(process.cwd(), "public", "uploads", id);
  await fs.mkdir(root, { recursive: true });

  const created: any[] = [];

  for (const f of files) {
    // @ts-ignore - File type from Web FormData
    const file = f as File;
    const arr = await file.arrayBuffer();
    const buf = Buffer.from(arr);

    const name = file.name.replace(/\s+/g, "_");
    const fullpath = path.join(root, name);
    await fs.writeFile(fullpath, buf);

    const publicUrl = `/uploads/${id}/${name}`;

    // Replace existing file(s) for this label
    await prisma.caseFile.deleteMany({ where: { caseId: id, label } });

    const kindAny = kind as any; // keep loose if your enum is narrower
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
