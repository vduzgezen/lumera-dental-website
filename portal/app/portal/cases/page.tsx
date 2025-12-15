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
  doctorName: string | null;
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

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return notFound();

  const sp = await searchParams;

  const getParam = (key: string): string | undefined => {
    const value = sp[key];
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
    return undefined;
  };

  const role = session.role;
  const canCreate = role === "lab" || role === "admin";
  const isDoctor = role === "customer";

  const clinicFilter = getParam("clinic");
  const doctorFilter = getParam("doctor");
  const caseIdFilter = getParam("caseId");
  const dateFilter = getParam("date");
  const aliasFilter = getParam("alias"); // for doctors

  const where: any = {};

  if (isDoctor) {
    // STRICT: doctors see only their own cases
    where.doctorUserId = session.userId ?? "__none__";

    if (aliasFilter && aliasFilter.trim()) {
      const q = aliasFilter.trim();
      where.OR = [
        { patientAlias: { contains: q } },
        { toothCodes: { contains: q } },
      ];
    }
  } else {
    // Lab/Admin: advanced filters
    if (clinicFilter && clinicFilter.trim()) {
      where.clinic = {
        name: { contains: clinicFilter.trim() },
      };
    }

    if (doctorFilter && doctorFilter.trim()) {
      // doctorName is nullable; simple contains filter
      where.doctorName = {
        contains: doctorFilter.trim(),
      };
    }

    if (caseIdFilter && caseIdFilter.trim()) {
      where.id = {
        contains: caseIdFilter.trim(),
      };
    }

    if (dateFilter && dateFilter.trim()) {
      const d = new Date(dateFilter);
      if (!Number.isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        // Filter on dueDate, not orderDate
        where.dueDate = { gte: start, lt: end };
      }
    }
  }

  const model = getCaseModel();

  const rows = (await model.findMany({
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
      doctorName: true,
      clinic: { select: { name: true } },
    },
  })) as CaseRow[];

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

      {/* 🔍 Search Bar */}
      <form className="mb-4 flex flex-wrap gap-2 items-center">
        {canCreate && (
          <>
            <input
              name="clinic"
              placeholder="Clinic"
              defaultValue={clinicFilter ?? ""}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
            />
            <input
              name="doctor"
              placeholder="Doctor"
              defaultValue={doctorFilter ?? ""}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
            />
            <input
              name="caseId"
              placeholder="Case ID"
              defaultValue={caseIdFilter ?? ""}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
            />
            <div className="flex items-center gap-1">
              <label className="text-xs text-white/60">Due date</label>
              <input
                type="date"
                name="date"
                defaultValue={dateFilter ?? ""}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-black rounded-lg px-3 py-1 text-sm"
            >
              Search
            </button>
            <Link
              href="/portal/cases"
              className="bg-transparent border border-white/20 text-white rounded-lg px-3 py-1 text-sm"
            >
              Clear
            </Link>
          </>
        )}

        {isDoctor && (
          <>
            <input
              name="alias"
              placeholder="Search by alias or tooth"
              defaultValue={aliasFilter ?? ""}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white flex-1"
            />
            <button
              type="submit"
              className="bg-white text-black rounded-lg px-3 py-1 text-sm"
            >
              Search
            </button>
            <Link
              href="/portal/cases"
              className="bg-transparent border border-white/20 text-white rounded-lg px-3 py-1 text-sm"
            >
              Clear
            </Link>
          </>
        )}
      </form>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="text-left p-3">Case ID</th>
              <th className="text-left p-3">Alias</th>
              <th className="text-left p-3">Clinic</th>
              <th className="text-left p-3">Doctor</th>
              <th className="text-left p-3">Tooth</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c: CaseRow) => (
              <tr
                key={c.id}
                className="border-t border-white/10 hover:bg-white/5 transition"
              >
                <td className="p-3">
                  <code className="text-xs">{c.id}</code>
                </td>
                <td className="p-3">
                  <Link href={`/portal/cases/${c.id}`} className="underline">
                    {c.patientAlias}
                  </Link>
                </td>
                <td className="p-3">{c.clinic.name}</td>
                <td className="p-3">{c.doctorName ?? "—"}</td>
                <td className="p-3">{c.toothCodes}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{fmtDate(c.dueDate)}</td>
                <td className="p-3">{fmtDate(c.updatedAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-white/60" colSpan={8}>
                  No cases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
