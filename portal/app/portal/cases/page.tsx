// app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import CaseListRow from "@/components/CaseListRow";

export const dynamic = "force-dynamic";

// Redefined here for server-side typing, passed to client component
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
  const aliasFilter = getParam("alias");

  const where: Prisma.DentalCaseWhereInput = {};

  if (isDoctor) {
    where.doctorUserId = session.userId ?? "__none__";

    if (aliasFilter && aliasFilter.trim()) {
      const q = aliasFilter.trim();
      where.OR = [
        { patientAlias: { contains: q } },
        { toothCodes: { contains: q } },
      ];
    }
  } else {
    if (clinicFilter && clinicFilter.trim()) {
      where.clinic = {
        name: { contains: clinicFilter.trim() },
      };
    }

    if (doctorFilter && doctorFilter.trim()) {
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
        where.dueDate = { gte: start, lt: end };
      }
    }
  }

  const rows = (await prisma.dentalCase.findMany({
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
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      
      {/* Header & Filters */}
      <div className="flex-none space-y-4 mb-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Cases</h1>
          {canCreate && (
            <Link
              href="/portal/cases/new"
              className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:bg-gray-200 transition"
            >
              + New Case
            </Link>
          )}
        </header>

        {/* Search Bar */}
        <form className="flex flex-wrap gap-2 items-center">
          {canCreate && (
            <>
              <input
                name="clinic"
                placeholder="Clinic"
                defaultValue={clinicFilter ?? ""}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-white/30 outline-none"
              />
              <input
                name="doctor"
                placeholder="Doctor"
                defaultValue={doctorFilter ?? ""}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-white/30 outline-none"
              />
              <input
                name="caseId"
                placeholder="Case ID"
                defaultValue={caseIdFilter ?? ""}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-white/30 outline-none"
              />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  name="date"
                  defaultValue={dateFilter ?? ""}
                  className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:border-white/30 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-black rounded-lg px-3 py-1 text-sm hover:bg-gray-200 transition"
              >
                Search
              </button>
              <Link
                href="/portal/cases"
                className="bg-transparent border border-white/20 text-white rounded-lg px-3 py-1 text-sm hover:bg-white/10 transition"
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
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white flex-1 focus:border-white/30 outline-none"
              />
              <button
                type="submit"
                className="bg-white text-black rounded-lg px-3 py-1 text-sm hover:bg-gray-200 transition"
              >
                Search
              </button>
              <Link
                href="/portal/cases"
                className="bg-transparent border border-white/20 text-white rounded-lg px-3 py-1 text-sm hover:bg-white/10 transition"
              >
                Clear
              </Link>
            </>
          )}
        </form>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-black/40 text-white/80 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-3 font-medium border-b border-white/10">Case ID</th>
                <th className="p-3 font-medium border-b border-white/10">Alias</th>
                <th className="p-3 font-medium border-b border-white/10">Clinic</th>
                <th className="p-3 font-medium border-b border-white/10">Doctor</th>
                <th className="p-3 font-medium border-b border-white/10">Tooth</th>
                <th className="p-3 font-medium border-b border-white/10">Status</th>
                <th className="p-3 font-medium border-b border-white/10">Due</th>
                <th className="p-3 font-medium border-b border-white/10">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((c) => (
                <CaseListRow key={c.id} data={c} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-white/40" colSpan={8}>
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}