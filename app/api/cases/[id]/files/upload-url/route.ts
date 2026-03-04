import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/storage";
import { prisma } from "@/lib/prisma"; // ✅ Import Prisma

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await props.params;
  const { id } = params;

  // ✅ SECURITY CHECK START
  // Prevent doctors from requesting upload URLs for cases they don't own
  if (session.role === "customer") {
    const dentalCase = await prisma.dentalCase.findUnique({
      where: { id },
      select: { doctorUserId: true, clinicId: true }
    });

    if (!dentalCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const isOwner = dentalCase.doctorUserId === session.userId;
    const isSameClinic = session.clinicId && dentalCase.clinicId === session.clinicId;

    if (!isOwner && !isSameClinic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // ✅ SECURITY CHECK END

  const { filename, contentType, label } = await req.json();
  
  // 1. Create a clean file path
  const safeName = (filename || "file").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const key = `cases/${id}/${label}_${Date.now()}_${safeName}`;

  // 2. Generate the URL
  const url = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ url, key });
}