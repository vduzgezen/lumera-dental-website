// app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type CaseRow = {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  clinic: { name: string };
};

/** Picks the correct model getter no matter how Prisma named it */
function getCaseModel(): any {
  const client: any = prisma as any;
  return client.dentalCase ?? client.case ?? client.case_;
}

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function CasesPage() {
  const session = await getSession();
  if (!session) return notFound();

  // STRICT: doctors see only their own cases (no clinic fallback)
  const where: any =
    session.role === "customer"
      ? { doctorUserId: session.userId ?? "__none__" }
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

  const canCreate = session.role === "lab" || session.role === "admin";

  return (
    <section>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Cases</h1>
        {canCreate && (
          <Link
            href="/portal/cases/new"
            className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
          >
            + New Case
          </Link>
        )}
      </header>

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
