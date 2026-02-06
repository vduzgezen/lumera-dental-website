// portal/app/portal/cases/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import MillingDashboard from "./milling/MillingDashboard"; 
import AutoRefresh from "@/components/AutoRefresh"; 
import CaseListClient from "./CaseListClient"; 
import CasesFilterBar from "./CasesFilterBar"; // ✅ New Component

export const dynamic = "force-dynamic";

export type CaseRow = {
  id: string;
  patientAlias: string;
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
    // ... (Keep existing Milling logic)
    const whereMilling: Prisma.DentalCaseWhereInput = {
        OR: [{ status: "APPROVED" }, { stage: "MILLING_GLAZING" }, { status: "IN_MILLING" }, { status: "SHIPPED" }]
    };
    const millingCases = await prisma.dentalCase.findMany({
        where: whereMilling,
        orderBy: { dueDate: "asc" },
        take: 300, 
        select: {
            id: true, patientAlias: true, patientFirstName: true, patientLastName: true, 
            toothCodes: true, status: true, dueDate: true, product: true, shade: true,
            updatedAt: true, createdAt: true, material: true, serviceLevel: true,
            doctorName: true, clinic: { select: { name: true } }, 
            assigneeUser: { select: { name: true, email: true } }, 
            doctorUser: { select: { name: true, address: { select: { zipCode: true, city: true, state: true } } } }
        }
    });
    const safeMillingCases = millingCases.map(c => ({ ...c, dueDate: c.dueDate ? c.dueDate : null })) as unknown as any[];
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

  const isDoctor = role === "customer";
  const isAdmin = role === "admin"; 
  const currentRole = role as string; 
  const canCreate = currentRole === "lab" || currentRole === "admin";

  const clinicFilter = getParam("clinic");
  const doctorFilter = getParam("doctor");
  const assigneeFilter = getParam("assignee");
  const caseIdFilter = getParam("caseId");
  const dateFilter = getParam("date");
  const aliasFilter = getParam("alias");
  const statusFilter = getParamArray("status");

  const where: Prisma.DentalCaseWhereInput = {};

  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  } else {
    if (isDoctor) {
        where.status = { notIn: ["DELIVERED"] };
    } else {
        where.status = { notIn: ["COMPLETED", "DELIVERED"] };
    }
  }

  if (isDoctor) {
    where.OR = [
      { doctorUserId: session.userId },
      { clinicId: session.clinicId ?? "__none__" }
    ];
    if (aliasFilter && aliasFilter.trim()) {
      where.AND = {
        OR: [
            { patientAlias: { contains: aliasFilter.trim(), mode: 'insensitive' } },
            { toothCodes: { contains: aliasFilter.trim(), mode: 'insensitive' } },
            { patientFirstName: { contains: aliasFilter.trim(), mode: 'insensitive' } },
            { patientLastName: { contains: aliasFilter.trim(), mode: 'insensitive' } }
        ]
      };
    }
  } else if (currentRole === "sales") {
    where.salesRepId = session.userId;
  } else {
    if (clinicFilter?.trim()) where.clinic = { name: { contains: clinicFilter.trim(), mode: 'insensitive' } };
    if (doctorFilter?.trim()) where.doctorName = { contains: doctorFilter.trim(), mode: 'insensitive' };
    if (caseIdFilter?.trim()) where.id = { contains: caseIdFilter.trim() };
    
    if (isAdmin && assigneeFilter?.trim()) {
        where.assigneeId = assigneeFilter.trim();
    }

    if (dateFilter?.trim()) {
      const d = new Date(dateFilter);
      if (!Number.isNaN(d.getTime())) {
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        where.dueDate = { gte: start, lt: end };
      }
    }
  }

  // Fetch Lab Users for Filter
  let labUsers: { id: string; name: string | null; email: string }[] = [];
  if (isAdmin) {
    labUsers = await prisma.user.findMany({
        where: { role: { in: ["lab", "admin"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" }
    });
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
                    address: { select: { zipCode: true, city: true, state: true } }
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
            className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:bg-gray-200 transition font-medium shadow-lg shadow-white/5"
            >
            + New Case
            </Link>
          )}
        </header>

        {/* ✅ REPLACED FORM WITH SMART FILTER BAR */}
        <CasesFilterBar 
            role={role}
            isAdmin={isAdmin}
            isDoctor={isDoctor}
            labUsers={labUsers}
        />
      </div>

      <CaseListClient cases={rows as CaseRow[]} role={role} />
      
      {totalCount > rows.length && (
        <div className="flex-none p-2 text-center text-xs text-white/30">
            Showing recent {rows.length} of {totalCount} cases. Use filters to find older records.
        </div>
      )}
    </section>
  );
}