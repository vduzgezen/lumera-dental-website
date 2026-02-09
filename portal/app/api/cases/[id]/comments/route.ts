// portal/app/api/cases/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSignedFileUrl } from "@/lib/storage";

// Helper to sign attachments in a comment list
async function signCommentAttachments(comment: any) {
  if (!comment || !comment.attachments) return comment;
  const signedAttachments = await Promise.all(
    comment.attachments.map(async (att: any) => {
      // If it's already a full URL (legacy), leave it. Otherwise, sign it.
      if (att.url.startsWith("http")) return att;
      try {
        const signed = await getSignedFileUrl(att.url);
        return { ...att, url: signed };
      } catch (e) {
        console.error("Failed to sign URL:", att.url);
        return att;
      }
    })
  );

  return { ...comment, attachments: signedAttachments };
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id: caseId } = params;
    
    // ✅ SECURITY FIX: verify access rights
    const dentalCase = await prisma.dentalCase.findUnique({
      where: { id: caseId },
      select: { id: true, doctorUserId: true, clinicId: true }
    });

    if (!dentalCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // If user is a Doctor, they MUST own the case or be in the same clinic
    if (session.role === "customer") {
      const isOwner = dentalCase.doctorUserId === session.userId;
      const isSameClinic = session.clinicId && dentalCase.clinicId === session.clinicId;
      
      if (!isOwner && !isSameClinic) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const json = await request.json();
    const { body, attachmentFileId } = json;
    
    if (!body && !attachmentFileId) {
      return NextResponse.json({ error: "Body or attachment required" }, { status: 400 });
    }

    // 1. Create the comment
    const newComment = await prisma.caseComment.create({
      data: {
        caseId,
        authorId: session.userId,
        body: body || "",
      },
    });

    // 2. Link the attachment if present
    if (attachmentFileId) {
      await prisma.caseFile.update({
        where: { id: attachmentFileId },
        data: { 
          commentId: newComment.id 
        } as any, 
      });
    }

    // 3. Fetch result with attachments
    const finalComment = await prisma.caseComment.findUnique({
      where: { id: newComment.id },
      include: {
        attachments: true,
      } as any,
    });

    const signedComment = await signCommentAttachments(finalComment);

    return NextResponse.json(signedComment);
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await props.params;
  const { id } = params;
  
  // ✅ SECURITY FIX: verify access rights
  const dentalCase = await prisma.dentalCase.findUnique({
    where: { id },
    select: { id: true, doctorUserId: true, clinicId: true }
  });

  if (!dentalCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // If user is a Doctor, they MUST own the case or be in the same clinic
  if (session.role === "customer") {
    const isOwner = dentalCase.doctorUserId === session.userId;
    const isSameClinic = session.clinicId && dentalCase.clinicId === session.clinicId;
    
    if (!isOwner && !isSameClinic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  
  const comments = await prisma.caseComment.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
    include: {
      attachments: true,
    } as any, 
  });

  const signedComments = await Promise.all(comments.map(signCommentAttachments));

  return NextResponse.json({ comments: signedComments });
}