import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CaseActions from '@/components/CaseActions';
import FileUploader from '@/components/FileUploader';
import Case3DPanel from '@/components/Case3DPanel';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

function fmtDate(d?: Date | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

/** Picks the correct model getter no matter how Prisma named it */
function getCaseModel(): any {
  const client: any = prisma as any;
  return client.dentalCase ?? client.case ?? client.case_;
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
      files: { orderBy: { createdAt: 'asc' } },
      events: { orderBy: { at: 'asc' } },
    },
  });

  if (!item) return notFound();

  // Customers can only view their own clinic's cases (tighten further to doctorUserId if you’ve added it)
  if (session.role === 'customer' && session.clinicId !== item.clinicId) {
    return notFound();
  }

  // Choose an STL for the 3D preview if available
  const firstStl = item.files.find((f: any) => f.kind === 'STL')?.url ?? null;

  const isLabOrAdmin = session.role === 'lab' || session.role === 'admin';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.patientAlias}</h1>
          <p className="text-white/70">
            Clinic: {item.clinic.name} • Teeth: {item.toothCodes} • Status: {item.status}
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

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Files list + uploaders */}
        <div className="rounded-xl border border-white/10 p-4 lg:col-span-1">
          <h2 className="font-medium mb-2">Files</h2>
          {item.files.length === 0 ? (
            <p className="text-white/60">No files yet.</p>
          ) : (
            <ul className="text-white/80 space-y-2">
              {item.files.map((f: any) => (
                <li key={f.id} className="flex items-center justify-between">
                  <span>
                    {f.kind} • <code className="text-xs">{f.url}</code>
                  </span>
                  <a
                    href={f.url}
                    target="_blank"
                    className="underline text-sm"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* ✅ Lab/Admin: three explicit uploaders with required props */}
          {isLabOrAdmin && (
            <div className="mt-4 space-y-3">
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="scan"
              />
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="design_with_model"
              />
              <FileUploader
                caseId={item.id}
                role={session.role as any}
                slot="design_only"
              />
              <p className="text-xs text-white/50 mt-2">
                Re-uploads allowed while in DESIGN stage. Files are stored under <code>/public/uploads</code>.
              </p>
            </div>
          )}
        </div>

        {/* Middle/Right: 3D panel */}
        <div className="lg:col-span-2">
          <Case3DPanel url={firstStl} title="3D Preview (STL)" />
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
                {ev.from ? `${ev.from} → ` : ''}{ev.to} • {fmtDate(ev.at)} {ev.note ? `— ${ev.note}` : ''}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
