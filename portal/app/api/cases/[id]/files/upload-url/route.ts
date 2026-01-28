// portal/app/api/cases/[id]/files/upload-url/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/storage";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ FIX: In Next.js 15, params is a Promise. You MUST await it.
  const params = await props.params;
  const { id } = params;

  const { filename, contentType, label } = await req.json();

  // 1. Create a clean file path
  const safeName = (filename || "file").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const key = `cases/${id}/${label}_${Date.now()}_${safeName}`;

  // 2. Generate the URL
  const url = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ url, key });
}