// app/portal/cases/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import CaseActions from "@/components/CaseActions";
import FileUploader from "@/components/FileUploader";
import CaseProcessBar from "@/components/CaseProcessBar";
import HtmlViewerUploader from "@/components/HtmlViewerUploader";
import CaseViewerTabs from "@/components/CaseViewerTabs";
import CommentsPanel from "@/components/CommentsPanel"; 
import { CaseFile, CaseStatus, ProductionStage } from "@prisma/client";
import CopyableId from "@/components/CopyableId";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

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

function baseNameFromUrl(url?: string | null): string {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1] || "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export default async function CaseDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return notFound();

  // 1. Fetch Case with Comments & Attachments
  // FIX: Added 'comments' include so the Doctor can actually see them
  const item = await prisma.dentalCase.findUnique({
    where: { id },
    include: {
      clinic: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { at: "asc" } },
      comments: { 
        include: { attachments: true },
        orderBy: { createdAt: "desc" } 
      }
    },
  });

  if (!item) return notFound();

  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return notFound();
  }

  // 2. Fetch Author Names for Comments
  const authorIds = Array.from(new Set(item.comments.map(c => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true, email: true }
  });
  const authorMap = new Map(authors.map(u => [u.id, u]));

  // 3. Prepare Comments Data for UI
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

  const ActionsPanel = ({ isSidebar = false }: { isSidebar?: boolean }) => (
    <div className={`rounded-xl border border-white/10 bg-black/20 flex flex-col overflow-hidden h-full`}>
      <div className="border-b border-white/10 px-4 bg-white/5 h-14 flex items-center shrink-0">
        <h2 className="font-medium text-sm text-white">Status & Actions</h2>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <div>
          <CaseActions
            caseId={item.id}
            role={session.role}
            currentStatus={item.status as CaseStatus}
          />
        </div>

        {/* Comments & Red Pen Panel */}
        <div className="pt-4 border-t border-white/10">
          <CommentsPanel 
            caseId={item.id}
            comments={uiComments}
            canPost={true} 
          />
        </div>

        <div className="pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
            History
          </h3>
          {item.events.length === 0 ? (
            <p className="text-white/60 text-sm">No events yet.</p>
          ) : (
            <div className="relative border-l border-white/10 ml-1 space-y-6">
              {item.events.map((ev) => (
                <div key={ev.id} className="ml-4 relative">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-black" />
                  <p className="text-sm font-medium text-white">
                    {ev.to.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-white/50">{fmtDate(ev.at)}</p>
                  {ev.note && (
                    <div className="mt-2 text-sm text-white/80 bg-white/5 p-2 rounded border border-white/5">
                      {ev.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // FIX: Collapsible Menu for Uploads to save space
  const UploadsSection = () => (
    <details className="group rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">📂 Manage Files</span>
          <span className="text-[10px] text-white/40 group-open:hidden">(Click to Expand)</span>
        </div>
        <svg 
          className="w-4 h-4 text-white/40 transform group-open:rotate-180 transition-transform" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      
      <div className="p-3 space-y-3 border-t border-white/10">
        {/* Scan */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Scan</span>
            {scanHtmlFile && <span className="text-[10px] text-blue-300">✓ Ready</span>}
          </div>
          <div className="bg-black/40 p-2 rounded border border-white/5">
            <HtmlViewerUploader caseId={item.id} role={session.role} label="scan_html" description="" />
          </div>
        </div>

        {/* Design + Model */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Design + Model</span>
            {designHtmlFile && <span className="text-[10px] text-blue-300">✓ Ready</span>}
          </div>
          <div className="bg-black/40 p-2 rounded border border-white/5">
             <HtmlViewerUploader caseId={item.id} role={session.role} label="design_with_model_html" description="" />
          </div>
        </div>

        {/* Design Only */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Design Only (3D)</span>
            {designOnlyFile && <span className="text-[10px] text-emerald-300">✓ Ready</span>}
          </div>
          <div className="bg-black/40 p-2 rounded border border-white/5">
             <FileUploader caseId={item.id} role={session.role} slot="design_only" />
          </div>
        </div>
      </div>
    </details>
  );

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
              {isLabOrAdmin && item.doctorName && (
                <><span>Doctor: <span className="text-white">{item.doctorName}</span></span><span>•</span></>
              )}
              <span>Teeth: <span className="text-white">{item.toothCodes}</span></span>
              <span>•</span>
              <span>Status: <span className="text-white font-medium">{item.status.replace(/_/g, " ")}</span></span>
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

      {/* FIX: 30/70 SPLIT LAYOUT */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {isLabOrAdmin ? (
          <>
            {/* LEFT COLUMN (30%): Uploads & Actions */}
            <div className="flex-none w-full lg:w-[30%] flex flex-col gap-4 h-full min-h-0">
              {/* Top Left: Collapsible Uploads */}
              <div className="flex-shrink-0">
                <UploadsSection />
              </div>
              {/* Bottom Left: Actions & Chat */}
              <div className="flex-1 min-h-0">
                <ActionsPanel isSidebar={true} />
              </div>
            </div>

            {/* RIGHT COLUMN (70%): Viewers (The Priority) */}
            <div className="flex-1 h-full min-h-0">
              <CaseViewerTabs
                scan3DUrl={scan3DUrl}
                designWithModel3DUrl={designWithModel3DUrl}
                designOnly3DUrl={designOnly3DUrl}
                scanHtmlUrl={scanHtmlUrl}
                designHtmlUrl={designHtmlUrl}
              />
            </div>
          </>
        ) : (
          <>
            {/* DOCTOR VIEW: Viewer Main (Left) + Actions Side (Right) */}
            <div className="flex-1 h-full min-h-0">
              <CaseViewerTabs
                scan3DUrl={scan3DUrl}
                designWithModel3DUrl={designWithModel3DUrl}
                designOnly3DUrl={designOnly3DUrl}
                scanHtmlUrl={scanHtmlUrl}
                designHtmlUrl={designHtmlUrl}
              />
            </div>
            <div className="flex-none w-full lg:w-[30%] h-full min-h-0">
              <ActionsPanel />
            </div>
          </>
        )}
      </div>
    </section>
  );
}