// portal/app/api/cases/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id: caseId } = params;
    
    const json = await request.json();
    const { body, attachmentFileId } = json;

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Body required" }, { status: 400 });
    }

    // 1. Create the comment
    const newComment = await prisma.caseComment.create({
      data: {
        caseId,
        authorId: session.userId,
        body,
      },
    });

    // 2. Link the attachment
    // We cast 'as any' because the Prisma types in node_modules are stale
    // and don't see 'commentId' yet, even though the DB has it.
    if (attachmentFileId) {
      await prisma.caseFile.update({
        where: { id: attachmentFileId },
        data: { 
          commentId: newComment.id 
        } as any, 
      });
    }

    // 3. Fetch result with attachments
    // Casting 'as any' allows us to request 'attachments' despite the stale types.
    const finalComment = await prisma.caseComment.findUnique({
      where: { id: newComment.id },
      include: {
        attachments: true,
      } as any,
    });

    return NextResponse.json(finalComment);
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  
  const comments = await prisma.caseComment.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
    include: {
      attachments: true,
    } as any, // Force TS to accept 'attachments'
  });
  
  return NextResponse.json(comments);
}