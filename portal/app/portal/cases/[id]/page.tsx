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

  // DIRECT FIX: Use prisma.dentalCase directly
  const item = await prisma.dentalCase.findUnique({
    where: { id },
    include: {
      clinic: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { at: "asc" } },
    },
  });

  if (!item) return notFound();

  // Customers can only view their own clinic's cases
  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return notFound();
  }

  const isLabOrAdmin = session.role === "lab" || session.role === "admin";

  // Latest files per slot
  let scanFile: CaseFile | null = null;
  let designWithModelFile: CaseFile | null = null;
  let designOnlyFile: CaseFile | null = null;

  // HTML viewer files
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

  return (
    <section className="space-y-6">
      {/* Process bar */}
      <CaseProcessBar
        caseId={item.id}
        stage={item.stage as ProductionStage}
        role={session.role}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.patientAlias}</h1>
          <p className="text-white/70">
            Clinic: {item.clinic.name} • Teeth: {item.toothCodes} • Status:{" "}
            {item.status}
          </p>
          <p className="text-white/50">Due: {fmtDate(item.dueDate)}</p>
        </div>

        <Link
          href="/portal/cases"
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          ← Back to cases
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: slot cards + uploaders */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scan slot (HTML-only upload) */}
          <div className="rounded-xl border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Scan</span>
              {scanHtmlFile && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Viewer
                </span>
              )}
            </div>

            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
              {scanHtmlFile ? (
                <div
                  className="text-xs text-white/80 truncate"
                  title={baseNameFromUrl(scanHtmlFile.url)}
                >
                  {baseNameFromUrl(scanHtmlFile.url)}
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  No Exocad scan viewer uploaded.
                </div>
              )}
            </div>

            {isLabOrAdmin && (
              <HtmlViewerUploader
                caseId={item.id}
                role={session.role}
                label="scan_html"
                description="Upload Exocad scan HTML viewer"
              />
            )}
          </div>

          {/* Design + Model slot (HTML-only upload) */}
          <div className="rounded-xl border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Design + Model
              </span>
              {designHtmlFile && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Viewer
                </span>
              )}
            </div>

            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
              {designHtmlFile ? (
                <div
                  className="text-xs text-white/80 truncate"
                  title={baseNameFromUrl(designHtmlFile.url)}
                >
                  {baseNameFromUrl(designHtmlFile.url)}
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  No Exocad design viewer uploaded.
                </div>
              )}
            </div>

            {isLabOrAdmin && (
              <HtmlViewerUploader
                caseId={item.id}
                role={session.role}
                label="design_with_model_html"
                description="Upload Exocad design + model HTML viewer"
              />
            )}
          </div>

          {/* Design Only slot (3D Lumera viewer) */}
          <div className="rounded-xl border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Design Only
              </span>
              {designOnlyFile && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  1 file
                </span>
              )}
            </div>

            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
              {designOnlyFile ? (
                <div
                  className="text-xs text-white/80 truncate"
                  title={baseNameFromUrl(designOnlyFile.url)}
                >
                  {baseNameFromUrl(designOnlyFile.url)}
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  No design-only 3D file uploaded.
                </div>
              )}
            </div>

            {isLabOrAdmin && (
              <FileUploader
                caseId={item.id}
                role={session.role}
                slot="design_only"
              />
            )}
          </div>
        </div>

        {/* Right: mixed viewer tabs (Exoviewer + Lumera) */}
        <div className="lg:col-span-2">
          <CaseViewerTabs
            scan3DUrl={scan3DUrl}
            designWithModel3DUrl={designWithModel3DUrl}
            designOnly3DUrl={designOnly3DUrl}
            scanHtmlUrl={scanHtmlUrl}
            designHtmlUrl={designHtmlUrl}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-2">Actions</h2>
        <CaseActions
          caseId={item.id}
          role={session.role}
          currentStatus={item.status as CaseStatus}
        />
        <p className="text-white/60 mt-2 text-sm">
          Approve / Request Changes updates the status timeline.
        </p>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-2">Status Timeline</h2>
        {item.events.length === 0 ? (
          <p className="text-white/60">No events yet.</p>
        ) : (
          <ol className="text-white/80 space-y-1">
            {item.events.map((ev) => (
              <li key={ev.id}>
                {ev.from ? `${ev.from} → ` : ""}
                {ev.to} • {fmtDate(ev.at)}{" "}
                {ev.note ? `— ${ev.note}` : ""}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}