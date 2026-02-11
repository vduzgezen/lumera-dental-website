// portal/app/portal/cases/page.tsx

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import MillingDashboard from "./milling/MillingDashboard";
import AutoRefresh from "@/components/AutoRefresh"; 
import CaseListClient from "./CaseListClient"; 
import CasesFilterBar from "./CasesFilterBar";

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
  clinic: { 
    name: string; 
    phone: string | null;
  };
  assigneeUser: { name: string | null; email: string } | null;
  product: string;
  material: string | null;
  serviceLevel: string | null;
  doctorUser: {
    name: string | null;
    phoneNumber: string | null;
    address: {
      street: string | null;
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

  // ✅ CONSTANT HELPERS
  const getParam = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const getParamArray = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
  };

  // ✅ UNIFIED LIMIT (50 for everyone)
  const limitParam = getParam("limit");
  const limit = limitParam ? parseInt(limitParam) : 50;

  // --- MILLING VIEW ---
  if (role === "milling") {
    
    // 1. Build Filter Query from Search Params
    const statusParams = getParamArray("status");
    const showShipped = getParam("showShipped") === "true";
    const doctorParam = getParam("doctor");
    const zipParam = getParam("zip");

    const whereMilling: any = {
        // Base Scope: Cases that have entered production
        stage: { in: ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"] }
    };

    // Status Filter Logic
    // If user explicitly selects statuses, use them.
    // If "Show Shipped" is ON, we ensure SHIPPED is included.
    // If NO params, default to APPROVED + IN_MILLING.
    
    let targetStatuses: string[] = [];

    if (statusParams.length > 0) {
        targetStatuses = [...statusParams];
    } else {
        targetStatuses = ["APPROVED", "IN_MILLING"];
    }

    if (showShipped && !targetStatuses.includes("SHIPPED")) {
        targetStatuses.push("SHIPPED");
    }

    whereMilling.status = { in: targetStatuses };

    // Dropdown Filters
    if (doctorParam && doctorParam !== "ALL") {
        whereMilling.OR = [
            { doctorName: doctorParam },
            { doctorUser: { name: doctorParam } }
        ];
    }

    if (zipParam && zipParam !== "ALL") {
        whereMilling.doctorUser = { address: { zipCode: zipParam } };
    }

    // 2. Fetch Data
    const [totalMillingCount, millingCases, distinctDoctors, distinctZips] = await Promise.all([
        prisma.dentalCase.count({ where: whereMilling }),
        prisma.dentalCase.findMany({
            where: whereMilling,
            orderBy: { dueDate: "asc" },
            take: limit, 
            select: {
                id: true, patientAlias: true, patientFirstName: true, patientLastName: true, 
                toothCodes: true, status: true, dueDate: true, product: true, shade: true,
                updatedAt: true, createdAt: true, material: true, serviceLevel: true,
                doctorName: true, 
                clinic: { 
                    select: { name: true, phone: true } 
                }, 
                assigneeUser: { select: { name: true, email: true } }, 
                doctorUser: { 
                    select: { 
                        name: true, 
                        phoneNumber: true, 
                        address: { 
                            select: { street: true, zipCode: true, city: true, state: true } 
                        } 
                    } 
                }
            }
        }),
        // Fetch ALL distinct doctors involved in milling stages (for the filter dropdown)
        prisma.dentalCase.findMany({
            where: { stage: { in: ["MILLING_GLAZING", "SHIPPING", "COMPLETED"] } },
            distinct: ['doctorName'],
            select: { doctorName: true, doctorUser: { select: { name: true } } }
        }),
        // Fetch ALL distinct zips
        prisma.dentalCase.findMany({
            where: { stage: { in: ["MILLING_GLAZING", "SHIPPING", "COMPLETED"] } },
            distinct: ['doctorUserId'], // Approx distinct users
            select: { doctorUser: { select: { address: { select: { zipCode: true } } } } }
        })
    ]);
    
    // Process Distinct Lists
    const uniqueDoctors = Array.from(new Set(
        distinctDoctors.map(c => c.doctorUser?.name || c.doctorName).filter(Boolean) as string[]
    )).sort();

    const uniqueZips = Array.from(new Set(
        distinctZips.map(c => c.doctorUser?.address?.zipCode).filter(Boolean) as string[]
    )).sort();

    const safeMillingCases = millingCases.map((c: any) => ({ 
        ...c, 
        dueDate: c.dueDate ? c.dueDate : null 
    })) as unknown as any[];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <AutoRefresh intervalMs={60000} />
            <MillingDashboard 
                cases={safeMillingCases} 
                totalCount={totalMillingCount}
                uniqueDoctors={uniqueDoctors}
                uniqueZips={uniqueZips}
            />
        </div>
    );
  }

  // --- STANDARD VIEW (Admin/Lab/Doctor) ---
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

  const where: any = {};
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
        take: limit, 
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
                phoneNumber: true,
                address: { select: { street: true, zipCode: true, city: true, state: true } }
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

        <CasesFilterBar 
            role={role}
            isAdmin={isAdmin}
            isDoctor={isDoctor}
            labUsers={labUsers}
        />
      </div>

      <CaseListClient 
        cases={rows as CaseRow[]} 
        role={role} 
        totalCount={totalCount}
      />
    </section>
  );
}