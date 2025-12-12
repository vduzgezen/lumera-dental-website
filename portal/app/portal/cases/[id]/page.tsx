// app/portal/cases/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import CaseActions from "@/components/CaseActions";
import FileUploader from "@/components/FileUploader";
import CasePreviewSwitcher from "@/components/CasePreviewSwitcher";
import CaseProcessBar from "@/components/CaseProcessBar";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

/** Picks the correct model getter no matter how Prisma named it */
function getCaseModel(): any {
  const client: any = prisma as any;
  return client.dentalCase ?? client.case ?? client.case_;
}

function normalizeSlot(
  label: any,
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
  const { id } = await params; // Next 15: params is async
  const session = await getSession();
  if (!session) return notFound();

  const model = getCaseModel();

  const item = await model.findUnique({
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

  // Pick the latest file for each slot based on label
  let scanFile: any = null;
  let designWithModelFile: any = null;
  let designOnlyFile: any = null;

  for (const f of item.files ?? []) {
    const slot = normalizeSlot(f.label);
    if (!slot) continue;

    if (slot === "scan") scanFile = f;
    if (slot === "design_with_model") designWithModelFile = f;
    if (slot === "design_only") designOnlyFile = f;
  }

  const scanUrl = is3DUrl(scanFile?.url) ? scanFile.url : null;
  const designWithModelUrl = is3DUrl(designWithModelFile?.url)
    ? designWithModelFile.url
    : null;
  const designOnlyUrl = is3DUrl(designOnlyFile?.url)
    ? designOnlyFile.url
    : null;

  return (
    <section className="space-y-6">
      {/* Process bar */}
      <CaseProcessBar
        caseId={item.id}
        stage={item.stage as any}
        role={session.role as any}
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
        {/* Left: three slot cards with file name + uploader */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scan slot */}
          <div className="rounded-xl border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Scan</span>
              {scanFile && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  1 file
                </span>
              )}
            </div>
            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
              {scanFile ? (
                <div
                  className="text-xs text-white/80 truncate"
                  title={baseNameFromUrl(scanFile.url)}
                >
                  {baseNameFromUrl(scanFile.url)}
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  No file uploaded.
                </div>
              )}
            </div>
            {isLabOrAdmin && (
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="scan"
              />
            )}
          </div>

          {/* Design + Model slot */}
          <div className="rounded-xl border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Design + Model
              </span>
              {designWithModelFile && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  1 file
                </span>
              )}
            </div>
            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2">
              {designWithModelFile ? (
                <div
                  className="text-xs text-white/80 truncate"
                  title={baseNameFromUrl(designWithModelFile.url)}
                >
                  {baseNameFromUrl(designWithModelFile.url)}
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  No file uploaded.
                </div>
              )}
            </div>
            {isLabOrAdmin && (
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="design_with_model"
              />
            )}
          </div>

          {/* Design Only slot */}
          <div className="rounded-xl border border-white/10 p-3 space-y-2">
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
                  No file uploaded.
                </div>
              )}
            </div>
            {isLabOrAdmin && (
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="design_only"
              />
            )}
          </div>
        </div>

        {/* Right: preview switcher */}
        <div className="lg:col-span-2">
          <CasePreviewSwitcher
            scanUrl={scanUrl}
            designWithModelUrl={designWithModelUrl}
            designOnlyUrl={designOnlyUrl}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-2">Actions</h2>
        <CaseActions
          caseId={item.id}
          role={session.role as any}
          currentStatus={item.status as any}
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
            {item.events.map((ev: any) => (
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
