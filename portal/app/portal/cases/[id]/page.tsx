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
import { CaseFile, CaseStatus, ProductionStage } from "@prisma/client";

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

  const item = await prisma.dentalCase.findUnique({
    where: { id },
    include: {
      clinic: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { at: "asc" } },
    },
  });

  if (!item) return notFound();

  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return notFound();
  }

  const isLabOrAdmin = session.role === "lab" || session.role === "admin";

  // Latest files per slot
  let scanFile: CaseFile | null = null;
  let designWithModelFile: CaseFile | null = null;
  let designOnlyFile: CaseFile | null = null;
  let scanHtmlFile: CaseFile | null = null;
  let designHtmlFile: CaseFile | null = null;

  for (const f of item.files) {
    const lbl = String(f.label ?? "").toLowerCase();
    const slot = normalizeSlot(lbl);

    if (slot === "scan") {
      scanFile = f;
      continue;
    }
    if (slot === "design_with_model") {
      designWithModelFile = f;
      continue;
    }
    if (slot === "design_only") {
      designOnlyFile = f;
      continue;
    }
    if (lbl === "scan_html") {
      scanHtmlFile = f;
      continue;
    }
    if (lbl === "design_with_model_html") {
      designHtmlFile = f;
      continue;
    }
  }

  const scan3DUrl = is3DUrl(scanFile?.url) ? scanFile!.url : null;
  const designWithModel3DUrl = is3DUrl(designWithModelFile?.url)
    ? designWithModelFile!.url
    : null;
  const designOnly3DUrl = is3DUrl(designOnlyFile?.url)
    ? designOnlyFile!.url
    : null;
  const scanHtmlUrl = scanHtmlFile?.url ?? null;
  const designHtmlUrl = designHtmlFile?.url ?? null;

  // Reusable Actions Panel
  const ActionsPanel = () => (
    <div className="rounded-xl border border-white/10 bg-black/20 flex flex-col h-full">
      {/* FIX: h-14 to match Tabs header exact height */}
      <div className="border-b border-white/10 px-4 bg-white/5 h-14 flex items-center">
        <h2 className="font-medium text-sm text-white">Status & Actions</h2>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <CaseActions
            caseId={item.id}
            role={session.role}
            currentStatus={item.status as CaseStatus}
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

  return (
    <section className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-none space-y-6">
        <CaseProcessBar
          caseId={item.id}
          stage={item.stage as ProductionStage}
          role={session.role}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{item.patientAlias}</h1>
            <p className="text-white/70 text-sm mt-1">
              Clinic: <span className="text-white">{item.clinic.name}</span> • 
              Teeth: <span className="text-white">{item.toothCodes}</span> • 
              Status: <span className="text-white font-medium">{item.status.replace(/_/g, " ")}</span>
            </p>
          </div>
          <Link
            href="/portal/cases"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
          >
            ← Back to Cases
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-3 items-stretch">
        
        {/* LAB UPLOADS */}
        {isLabOrAdmin && (
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
             <div className="rounded-xl border border-white/10 p-4 space-y-3 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Scan</span>
                {scanHtmlFile && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">Viewer Ready</span>}
              </div>
              <HtmlViewerUploader caseId={item.id} role={session.role} label="scan_html" description="Upload Scan Viewer" />
            </div>

            <div className="rounded-xl border border-white/10 p-4 space-y-3 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Design + Model</span>
                {designHtmlFile && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">Viewer Ready</span>}
              </div>
              <HtmlViewerUploader caseId={item.id} role={session.role} label="design_with_model_html" description="Upload Design Viewer" />
            </div>

            <div className="rounded-xl border border-white/10 p-4 space-y-3 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Design Only (3D)</span>
                {designOnlyFile && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">3D Ready</span>}
              </div>
              <FileUploader caseId={item.id} role={session.role} slot="design_only" />
            </div>
          </div>
        )}

        {/* VIEWER */}
        <div className={isLabOrAdmin ? "lg:col-span-1" : "lg:col-span-2"}>
          <CaseViewerTabs
            scan3DUrl={scan3DUrl}
            designWithModel3DUrl={designWithModel3DUrl}
            designOnly3DUrl={designOnly3DUrl}
            scanHtmlUrl={scanHtmlUrl}
            designHtmlUrl={designHtmlUrl}
          />
        </div>

        {/* ACTIONS */}
        <div className="lg:col-span-1">
          <ActionsPanel />
        </div>
      </div>
    </section>
  );
}