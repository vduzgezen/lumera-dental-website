// app/portal/cases/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import CaseActions from "@/components/CaseActions";
import FileUploader from "@/components/FileUploader";
import STLViewer from "@/components/STLViewer";
import ProgressTracker from "@/components/ProgressTracker";
import Comments from "@/components/Comments";

export const dynamic = "force-dynamic";

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

/** Picks the correct model getter no matter how Prisma named it */
function getCaseModel(): any {
  const client: any = prisma as any;
  return client.dentalCase ?? client.case ?? client.case_;
}

type Props = { params: { id: string } };

export default async function CaseDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) return notFound();

  const model = getCaseModel();

  const item = await model.findUnique({
    where: { id: params.id },
    include: {
      clinic: true,
      files: true,
      events: { orderBy: { at: "asc" } },
    },
  });

  if (!item) return notFound();

  // Customers can only view their own clinic’s cases
  if (session.role === "customer" && session.clinicId !== item.clinicId) {
    return notFound();
  }

  const hasSTL = item.files.some((f: any) => f.kind === "STL");
  const firstSTL = item.files.find((f: any) => f.kind === "STL");

  return (
    <section className="space-y-6">
      {/* Top header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{item.patientAlias}</h1>
        <p className="text-white/70">
          Clinic: {item.clinic.name} • Teeth: {item.toothCodes} • Status: {item.status}
        </p>
        <p className="text-white/50">Due: {fmtDate(item.dueDate)}</p>
      </header>

      {/* 3-part production tracker */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-3">Production Progress</h2>
        <ProgressTracker stage={item.stage as any} />
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-white/80">
          <div>
            <div className="font-medium">Design</div>
            <div>Designed: {fmtDate(item.designedAt)}</div>
          </div>
          <div>
            <div className="font-medium">Milling &amp; Glazing</div>
            <div>Milled/Glazed: {fmtDate(item.milledAt)}</div>
          </div>
          <div>
            <div className="font-medium">Shipping</div>
            <div>Shipped: {fmtDate(item.shippedAt)}</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Design & Files (viewer + photos + uploader) */}
        <div className="rounded-xl border border-white/10 p-4" id="design-section">
          <h2 className="font-medium mb-2">Design & Files</h2>

          {/* Optional designer question for doctor review */}
          {item.needsReview && item.reviewQuestion && (
            <p className="mb-2 text-amber-300">Designer note: {item.reviewQuestion}</p>
          )}

          {/* STL viewer */}
          {hasSTL ? (
            <STLViewer url={firstSTL!.url} height={420} />
          ) : (
            <p className="text-white/60 mb-2">No STL uploaded yet.</p>
          )}

          {/* Image thumbnails */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.files.filter((f: any) => f.kind === "PHOTO").map((f: any) => (
              <a key={f.id} href={f.url} target="_blank" className="block">
                <img
                  src={f.url}
                  alt="case photo"
                  className="w-full h-28 object-cover rounded-lg border border-white/10"
                />
              </a>
            ))}
            {item.files.filter((f: any) => f.kind === "PHOTO").length === 0 && (
              <p className="text-white/60">No photos yet.</p>
            )}
          </div>

          {/* Uploader (lab/admin only) */}
          <div className="mt-4">
            <FileUploader caseId={item.id} role={session.role as any} />
          </div>
        </div>

        {/* Order / Shipping info and Timeline */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="font-medium mb-2">Order & Shipping</h2>
            <ul className="text-white/80 space-y-1">
              <li>Stage: <b>{item.stage}</b></li>
              <li>Carrier: {item.shippingCarrier ?? "—"}</li>
              <li>Tracking: {item.trackingNumber ?? "—"}</li>
              <li>ETA: {fmtDate(item.shippingEta)}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="font-medium mb-2">Status Timeline</h2>
            {item.events.length === 0 ? (
              <p className="text-white/60">No events yet.</p>
            ) : (
              <ol className="text-white/80 space-y-1">
                {item.events.map((ev: any) => (
                  <li key={ev.id}>
                    {ev.from ? `${ev.from} → ` : ""}{ev.to}
                    {" • "}
                    {fmtDate(ev.at)}
                    {ev.note ? <> — <span className="text-white/70">{ev.note}</span></> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Actions (Approve / Request Changes) */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-2">Actions</h2>
        <CaseActions
          caseId={item.id}
          role={session.role as any}
          currentStatus={item.status as any}
        />
        <p className="text-white/60 mt-2 text-sm">
          Approve / Request Changes available now.
        </p>
      </div>

      {/* Comments thread */}
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-medium mb-2">Comments</h2>
        <Comments caseId={item.id} />
      </div>
    </section>
  );
}
