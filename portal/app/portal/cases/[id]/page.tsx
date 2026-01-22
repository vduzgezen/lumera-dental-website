// app/portal/cases/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import CaseProcessBar from "@/components/CaseProcessBar";
import CaseViewerTabs from "@/components/CaseViewerTabs";
import { CaseFile } from "@prisma/client";
import CopyableId from "@/components/CopyableId";
import CaseDetailSidebar from "@/components/CaseDetailSidebar";

export const dynamic = "force-dynamic";

type ProductionStage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED";

type Params = Promise<{ id: string }>;

function normalizeSlot(
  label: string | null,
): "scan" | "design_with_model" | "design_only" | null {
  const lower = String(label ?? "").toLowerCase();
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") {
    return "design_with_model";
  }
  if (lower === "design_only") return "design_only";
  return null;
}

function is3DUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.endsWith(".stl") || u.endsWith(".ply") || u.endsWith(".obj");
}

export default async function CaseDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return notFound();

  // Fetch the case + assignee info
  const item = await prisma.dentalCase.findUnique({
    where: { id },
    include: {
      clinic: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { at: "asc" } },
      comments: { 
        include: { attachments: true },
        orderBy: { createdAt: "desc" } 
      },
      // Fetch current assignee details
      assigneeUser: { select: { id: true, name: true, email: true } }
    },
  });

  if (!item) return notFound();

  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return notFound();
  }

  // Fetch Authors for Comments
  const authorIds = Array.from(new Set(item.comments.map(c => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true, email: true }
  });
  const authorMap = new Map(authors.map(u => [u.id, u]));

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true }
  });
  const currentUserName = currentUser?.name || currentUser?.email || "Unknown";

  const uiComments = item.comments.map(c => {
    const author = authorMap.get(c.authorId);
    return {
      id: c.id,
      body: c.body,
      at: c.createdAt,
      author: author?.name || author?.email || "Unknown",
      role: author?.role || "user",
      attachments: c.attachments.map(a => ({
        id: a.id,
        url: a.url,
        kind: a.kind
      }))
    };
  });

  const isLabOrAdmin = session.role === "lab" || session.role === "admin";

  // Fetch Potential Designers (Lab/Admin users) if viewer is Admin
  // Only Admin needs this list now, as Lab cannot re-assign.
  let designers: { id: string; name: string | null; email: string }[] = [];
  if (session.role === "admin") {
    designers = await prisma.user.findMany({
      where: { role: { in: ["lab", "admin"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    });
  }

  let scanFile: CaseFile | null = null;
  let designWithModelFile: CaseFile | null = null;
  let designOnlyFile: CaseFile | null = null;
  let scanHtmlFile: CaseFile | null = null;
  let designHtmlFile: CaseFile | null = null;

  for (const f of item.files) {
    const lbl = String(f.label ?? "").toLowerCase();
    const slot = normalizeSlot(lbl);
    if (slot === "scan") { scanFile = f; continue; }
    if (slot === "design_with_model") { designWithModelFile = f; continue; }
    if (slot === "design_only") { designOnlyFile = f; continue; }
    if (lbl === "scan_html") { scanHtmlFile = f; continue; }
    if (lbl === "design_with_model_html") { designHtmlFile = f; continue; }
  }

  const scan3DUrl = is3DUrl(scanFile?.url) ? scanFile!.url : null;
  const designWithModel3DUrl = is3DUrl(designWithModelFile?.url) ? designWithModelFile!.url : null;
  const designOnly3DUrl = is3DUrl(designOnlyFile?.url) ? designOnlyFile!.url : null;
  const scanHtmlUrl = scanHtmlFile?.url ?? null;
  const designHtmlUrl = designHtmlFile?.url ?? null;

  const statusColor = 
    item.status === "CHANGES_REQUESTED" ? "text-red-400" :
    item.status === "COMPLETED" ? "text-emerald-400" :
    "text-white";

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      <div className="flex-none space-y-4 mb-4">
        <CaseProcessBar
          caseId={item.id}
          stage={item.stage as ProductionStage}
          status={item.status}
          role={session.role}
        />
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-2xl font-semibold">{item.patientAlias}</h1>
            <div className="text-white/70 text-sm mt-1 flex flex-wrap items-center gap-x-3">
              <span>Clinic: <span className="text-white">{item.clinic.name}</span></span>
              <span>•</span>
              
              {/* DOCTOR NAME: Visible to Lab/Admin */}
              {isLabOrAdmin && item.doctorName && (
                <><span>Doctor: <span className="text-white">{item.doctorName}</span></span><span>•</span></>
              )}

              {/* DESIGNER NAME: Visible to Lab/Admin only */}
              {isLabOrAdmin && item.assigneeUser && (
                <>
                  <span>Designer: <span className="text-white">{item.assigneeUser.name || item.assigneeUser.email}</span></span>
                  <span>•</span>
                </>
              )}

              <span>Teeth: <span className="text-white">{item.toothCodes}</span></span>
              <span>•</span>
              <span>Status: <span className={`${statusColor} font-medium`}>{item.status.replace(/_/g, " ")}</span></span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                 <span>ID:</span><CopyableId id={item.id} />
              </div>
            </div>
          </div>
          <Link href="/portal/cases" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
            ← Back to Cases
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        <div className="flex-none w-full lg:w-[30%] h-full min-h-0">
          <CaseDetailSidebar 
            caseId={item.id}
            role={session.role}
            files={item.files}
            comments={uiComments}
            events={item.events}
            currentUserName={currentUserName}
            designPreferences={item.designPreferences}
            assigneeId={item.assigneeId}
            designers={designers}
          />
        </div>

        <div className="flex-1 h-full min-h-0">
          <CaseViewerTabs
            caseId={item.id}
            role={session.role}
            status={item.status}
            scan3DUrl={scan3DUrl}
            designWithModel3DUrl={designWithModel3DUrl}
            designOnly3DUrl={designOnly3DUrl}
            scanHtmlUrl={scanHtmlUrl}
            designHtmlUrl={designHtmlUrl}
          />
        </div>
      </div>
    </section>
  );
}