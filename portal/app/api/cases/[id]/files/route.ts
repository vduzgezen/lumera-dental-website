// app/api/cases/[id]/files/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  // Resolve model names at runtime (avoids TS issues if types are stale)
  const g: any = prisma as any;
  const CaseModel = g.dentalCase ?? g.case ?? g.case_;
  const CaseFileModel = g.caseFile ?? g.case_file ?? g.casefile;

  const item = await CaseModel.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const root = path.join(process.cwd(), "public", "uploads", params.id);
  await fs.mkdir(root, { recursive: true });

  const created = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (f.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
    }
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    const safeBase = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${crypto.randomUUID()}${ext ? "." + ext : ""}`;
    const fullpath = path.join(root, name);

    const buf = Buffer.from(await f.arrayBuffer());
    await fs.writeFile(fullpath, buf);

    const kind =
      ext === "stl" ? "STL" : IMAGE_EXT.has(ext) ? "PHOTO" : "OTHER";
    const publicUrl = `/uploads/${params.id}/${name}`;

    const rec = await CaseFileModel.create({
      data: {
        caseId: params.id,
        kind,
        url: publicUrl,
        sizeBytes: buf.length,
      },
    });
    created.push(rec);
  }

  return NextResponse.json({ ok: true, files: created });
}
