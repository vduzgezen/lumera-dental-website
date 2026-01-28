// portal/app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import StatusFilter from "@/components/StatusFilter";
import MillingDashboard from "./milling/MillingDashboard"; 
import AutoRefresh from "@/components/AutoRefresh"; 
import CaseListClient from "./CaseListClient"; 

export const dynamic = "force-dynamic";

export type CaseRow = {
  id: string;
  patientAlias: string;
  // ✅ NEW FIELDS
  patientFirstName: string | null;
  patientLastName: string | null;
  
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  clinic: { name: string };
  assigneeUser: { name: string | null; email: string } | null;
  
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

  // --- MILLING VIEW ---
  if (role === "milling") {
    const whereMilling: Prisma.DentalCaseWhereInput = {
        OR: [
            { status: "APPROVED" },
            { stage: "MILLING_GLAZING" },
            { status: "IN_MILLING" },
            { status: "SHIPPED" } 
        ]
    };

    const millingCases = await prisma.dentalCase.findMany({
        where: whereMilling,
        orderBy: { dueDate: "asc" },
        take: 300, 
        select: {
            id: true, 
            patientAlias: true,
            // Milling doesn't strictly need names in the table view, but good to have if we expand
            patientFirstName: true,
            patientLastName: true, 
            toothCodes: true, 
            status: true,
            dueDate: true, 
            product: true, 
            shade: true,
            updatedAt: true,
            createdAt: true,
            material: true,
            serviceLevel: true,
            doctorName: true,
            clinic: { select: { name: true } }, 
            assigneeUser: { select: { name: true, email: true } }, 
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

    const safeMillingCases = millingCases.map(c => ({
        ...c, 
        dueDate: c.dueDate ? c.dueDate : null 
    })) as unknown as any[];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <AutoRefresh intervalMs={60000} />
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
        // Allow doctors to search by patient name too
        { patientFirstName: { contains: aliasFilter.trim() } },
        { patientLastName: { contains: aliasFilter.trim() } }
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

  const [totalCount, rows] = await Promise.all([
    prisma.dentalCase.count({ where }),
    prisma.dentalCase.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
        select: {
            id: true, 
            patientAlias: true,
            // ✅ FETCH THESE
            patientFirstName: true,
            patientLastName: true, 
            toothCodes: true,
            status: true, 
            dueDate: true, 
            updatedAt: true,
            createdAt: true,
            doctorName: true,
            clinic: { select: { name: true } },
            assigneeUser: { select: { name: true, email: true } },
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
      <AutoRefresh intervalMs={60000} />

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
            <input name="alias" placeholder="Search patient, ID, or name..." defaultValue={aliasFilter ?? ""} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1 min-w-[200px] outline-none" />
          )}
          <button type="submit" className="bg-white text-black rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-200 transition">Search</button>
          {(clinicFilter || doctorFilter || caseIdFilter || dateFilter || aliasFilter || statusFilter.length > 0) && (
             <Link href="/portal/cases" className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">Clear</Link>
          )}
        </form>
      </div>

      <CaseListClient 
        cases={rows as CaseRow[]} 
        role={role} 
        isDoctor={isDoctor} 
      />
      
      {totalCount > rows.length && (
        <div className="flex-none p-2 text-center text-xs text-white/30">
            Showing recent {rows.length} of {totalCount} cases. Use filters to find older records.
        </div>
      )}
    </section>
  );
}