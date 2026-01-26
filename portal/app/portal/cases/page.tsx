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

// ✅ UPDATED: Added new fields (product, material, serviceLevel, doctorUser)
// This ensures TypeScript allows us to fetch/pass this data.
export type CaseRow = {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date; // Added for sorting consistency
  doctorName: string | null;
  clinic: { name: string };
  assigneeUser: { name: string | null; email: string } | null;
  
  // New Fields for Logic/Dashboard
  product: string;
  material: string | null;
  serviceLevel: string | null;
  doctorUser: {
    name: string | null;
    address: {
      zipCode: string | null;
      city: string | null;
      state: string | null;
    } | null;
  } | null;
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
    // LOGIC CHANGE: Milling sees "APPROVED" (Waiting) and "IN_MILLING" (Active/Milling)
    const whereMilling: Prisma.DentalCaseWhereInput = {
        OR: [
            { status: "APPROVED" },
            { stage: "MILLING_GLAZING" },
            { status: "IN_MILLING" } // Explicitly include IN_MILLING status
        ]
    };

    const totalMilling = await prisma.dentalCase.count({ where: whereMilling });
    
    // ✅ INJECTED: Fetching address/material/serviceLevel for Dashboard Filters
    const millingCases = await prisma.dentalCase.findMany({
        where: whereMilling,
        orderBy: { dueDate: "asc" },
        take: 200, 
        select: {
            id: true, 
            patientAlias: true, 
            toothCodes: true, 
            status: true,
            dueDate: true, 
            product: true, 
            shade: true,
            updatedAt: true,
            createdAt: true,
            // New Fields
            material: true,
            serviceLevel: true,
            doctorName: true,
            clinic: { select: { name: true } }, // Required by type
            assigneeUser: { select: { name: true, email: true } }, // Required by type
            doctorUser: {
                select: {
                    name: true,
                    address: {
                        select: { zipCode: true, city: true, state: true }
                    }
                }
            }
        }
    });

    // Cast to any to bypass strict serialization checks for the dashboard component if needed
    // or keep your existing map logic if MillingDashboard expects strings.
    // Assuming new MillingDashboard accepts Date or string, we pass as is or map.
    const safeMillingCases = millingCases.map(c => ({
        ...c, 
        dueDate: c.dueDate ? c.dueDate : null // Passing Date object to match Component Interface
    })) as unknown as any[]; 

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <MillingDashboard cases={safeMillingCases} />
        </div>
    );
  }

  // --- STANDARD VIEW ---
  const getParam = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const getParamArray = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
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
  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  } else {
    where.status = { not: "COMPLETED" };
  }

  if (isDoctor) {
    where.doctorUserId = session.userId ?? "__none__";
    if (aliasFilter && aliasFilter.trim()) {
      where.OR = [
        { patientAlias: { contains: aliasFilter.trim() } },
        { toothCodes: { contains: aliasFilter.trim() } },
      ];
    }
  } else {
    if (clinicFilter?.trim()) where.clinic = { name: { contains: clinicFilter.trim() } };
    if (doctorFilter?.trim()) where.doctorName = { contains: doctorFilter.trim() };
    if (caseIdFilter?.trim()) where.id = { contains: caseIdFilter.trim() };
    if (dateFilter?.trim()) {
      const d = new Date(dateFilter);
      if (!Number.isNaN(d.getTime())) {
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        where.dueDate = { gte: start, lt: end };
      }
    }
  }

  // ✅ INJECTED: Fetching new fields here too for consistency
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
            createdAt: true,
            doctorName: true,
            clinic: { select: { name: true } },
            assigneeUser: { select: { name: true, email: true } },
            // New Fields
            product: true,
            material: true,
            serviceLevel: true,
            doctorUser: {
                select: {
                    name: true,
                    address: {
                        select: { zipCode: true, city: true, state: true }
                    }
                }
            }
        },
    })
  ]);

  return (
    <section className="flex flex-col h-full w-full p-6 overflow-hidden">
      <div className="flex-none space-y-4 mb-4">
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-white">Cases</h1>
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
              <input name="clinic" placeholder="Clinic Name" defaultValue={clinicFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40" />
              <input name="doctor" placeholder="Doctor Name" defaultValue={doctorFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40" />
              <input name="caseId" placeholder="Case ID" defaultValue={caseIdFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 font-mono" />
              <input type="date" name="date" defaultValue={dateFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark]" />
            </>
          )}
          {isDoctor && (
            <input name="alias" placeholder="Search patient alias..." defaultValue={aliasFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1 min-w-[200px] outline-none" />
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