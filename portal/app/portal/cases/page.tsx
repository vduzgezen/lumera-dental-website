// app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // avoid caching while developing

type CaseRow = {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;        // we'll switch to $Enums.CaseStatus later
  dueDate: Date | null;
  updatedAt: Date;
  clinic: { name: string };
};

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

/** Picks the correct model getter no matter how Prisma named it */
function getCaseModel(): any {
  const client: any = prisma as any;
  return client.dentalCase ?? client.case ?? client.case_;
}

export default async function CasesPage() {
  const session = await getSession();
  if (!session) {
    return (
      <main className="p-6 text-red-400">
        <p>Unauthorized</p>
      </main>
    );
  }

  const where =
    session.role === "customer" && session.clinicId
      ? { clinicId: session.clinicId }
      : {};

  const model = getCaseModel();

  const rows: CaseRow[] = await model.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      patientAlias: true,
      toothCodes: true,
      status: true,
      dueDate: true,
      updatedAt: true,
      clinic: { select: { name: true } },
    },
  });

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Cases</h1>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="text-left p-3">Alias</th>
              <th className="text-left p-3">Clinic</th>
              <th className="text-left p-3">Tooth</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-3">
                  <a className="underline" href={`/portal/cases/${c.id}`}>
                    {c.patientAlias}
                  </a>
                </td>
                <td className="p-3">{c.clinic.name}</td>
                <td className="p-3">{c.toothCodes}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{fmtDate(c.dueDate)}</td>
                <td className="p-3">{fmtDate(c.updatedAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-white/60" colSpan={6}>
                  No cases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
