// portal/app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import CaseListRow from "@/components/CaseListRow";
import StatusFilter from "@/components/StatusFilter";
import MillingDashboard from "./MillingDashboard"; 

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
  assigneeUser: { name: string | null; email: string } | null;
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return notFound();

  const sp = await searchParams;
  const role = session.role;

  // --- MILLING VIEW (Optimized) ---
  if (role === "milling") {
    const totalMilling = await prisma.dentalCase.count({
        where: { stage: "MILLING_GLAZING" }
    });

    const millingCases = await prisma.dentalCase.findMany({
        where: { stage: "MILLING_GLAZING" },
        orderBy: { dueDate: "asc" },
        take: 200, 
        select: {
            id: true,
            patientAlias: true,
            toothCodes: true,
            status: true,
            dueDate: true,
            product: true,
            shade: true
        }
    });

    const safeMillingCases = millingCases.map(c => ({
        ...c,
        dueDate: c.dueDate ? c.dueDate.toISOString() : null
    }));

    return (
        <div className="flex flex-col h-full">
            <MillingDashboard cases={safeMillingCases} />
            {totalMilling > 200 && (
                <div className="text-center p-2 text-xs text-white/30 bg-midnight">
                    ⚠️ Showing top 200 of {totalMilling} active cases. Clear some to see more.
                </div>
            )}
        </div>
    );
  }

  // --- STANDARD VIEW ---
  const getParam = (key: string): string | undefined => {
    const value = sp[key];
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
    return undefined;
  };
  const getParamArray = (key: string): string[] => {
    const value = sp[key];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
  };

  const canCreate = role === "lab" || role === "admin";
  const isDoctor = role === "customer";

  const clinicFilter = getParam("clinic");
  const doctorFilter = getParam("doctor");
  const caseIdFilter = getParam("caseId");
  const dateFilter = getParam("date");
  const aliasFilter = getParam("alias");
  const statusFilter = getParamArray("status");

  const where: Prisma.DentalCaseWhereInput = {};

  // ✅ LOGIC CHANGE: Default to "Active Only"
  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  } else {
    // If no filter selected, show everything EXCEPT completed
    where.status = { not: "COMPLETED" };
  }

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
      where.clinic = { name: { contains: clinicFilter.trim() } };
    }
    if (doctorFilter && doctorFilter.trim()) {
      where.doctorName = { contains: doctorFilter.trim() };
    }
    if (caseIdFilter && caseIdFilter.trim()) {
      where.id = { contains: caseIdFilter.trim() };
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

  const [totalCount, rows] = await Promise.all([
    prisma.dentalCase.count({ where }),
    prisma.dentalCase.findMany({
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
            assigneeUser: { select: { name: true, email: true } }
        },
    })
  ]);

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      <div className="flex-none space-y-4 mb-4">
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold">Cases</h1>
            <span className="text-sm text-white/40">Total: {totalCount}</span>
          </div>
          {canCreate && (
            <Link
              href="/portal/cases/new"
              className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:bg-gray-200 transition font-medium"
            >
              + New Case
            </Link>
          )}
        </header>

        <form className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
          <StatusFilter selected={statusFilter} />

          {canCreate && (
            <>
              <input name="clinic" placeholder="Clinic Name" defaultValue={clinicFilter ?? ""}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-32 lg:w-40 transition" />
              <input name="doctor" placeholder="Doctor Name" defaultValue={doctorFilter ?? ""}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-32 lg:w-40 transition" />
              <input name="caseId" placeholder="Case ID" defaultValue={caseIdFilter ?? ""}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-32 transition font-mono" />
              <div className="flex items-center gap-1">
                <input type="date" name="date" defaultValue={dateFilter ?? ""}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none transition [color-scheme:dark]" />
              </div>
            </>
          )}

          {isDoctor && (
            <input name="alias" placeholder="Search patient alias or tooth #" defaultValue={aliasFilter ?? ""}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1 min-w-[200px] focus:border-blue-500/50 outline-none transition" />
          )}

          <button type="submit" className="bg-white text-black rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-200 transition">Search</button>
          
          {(clinicFilter || doctorFilter || caseIdFilter || dateFilter || aliasFilter || statusFilter.length > 0) && (
            <Link href="/portal/cases" className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">Clear</Link>
          )}
        </form>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">Case ID</th>
                <th className="p-4 font-medium">Alias</th>
                <th className="p-4 font-medium">Clinic</th>
                <th className="p-4 font-medium">Doctor</th>
                {!isDoctor && <th className="p-4 font-medium">Designer</th>}
                <th className="p-4 font-medium">Tooth</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(rows as CaseRow[]).map((c) => (
                <CaseListRow key={c.id} data={c} role={role} />
              ))}
              {rows.length === 0 && (
                <tr><td className="p-12 text-center text-white/40" colSpan={9}>No cases found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex-none p-2 border-t border-white/5 bg-white/[0.02] text-center text-xs text-white/30">
            {totalCount > rows.length 
                ? `Showing recent ${rows.length} of ${totalCount} cases. Use filters to find older records.` 
                : `Showing all ${rows.length} cases.`}
        </div>
      </div>
    </section>
  );
}