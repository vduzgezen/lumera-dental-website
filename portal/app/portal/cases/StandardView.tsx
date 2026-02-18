// app/portal/cases/StandardView.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AutoRefresh from "@/components/ui/AutoRefresh";
import CaseListClient from "./CaseListClient"; 
import CasesFilterBar from "./CasesFilterBar";
import { CaseRow } from "./types";

export default async function StandardView({ 
  searchParams, 
  session 
}: { 
  searchParams: Record<string, string | string[] | undefined>;
  session: any;
}) {
  const role = session.role;
  const isDoctor = role === "customer";
  const isAdmin = role === "admin";
  const currentRole = role as string; 
  const canCreate = currentRole === "lab" || currentRole === "admin";

  // Helpers
  const getParam = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const getParamArray = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
  };

  const limitParam = getParam("limit");
  const limit = limitParam ? parseInt(limitParam) : 50;

  const clinicFilter = getParam("clinic");
  const doctorFilter = getParam("doctor");
  const assigneeFilter = getParam("assignee");
  const caseIdFilter = getParam("caseId");
  const dateFilter = getParam("date");
  const aliasFilter = getParam("alias");
  const searchFilter = getParam("search");
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

    const query = searchFilter || aliasFilter;

    if (query && query.trim()) {
      where.AND = {
        OR: [
            { id: { contains: query.trim() } },
            { patientAlias: { contains: query.trim(), mode: 'insensitive' } },
            { toothCodes: { contains: query.trim(), mode: 'insensitive' } },
            { patientFirstName: { contains: query.trim(), mode: 'insensitive' } },
            { patientLastName: { contains: query.trim(), mode: 'insensitive' } }
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

    if (searchFilter?.trim()) {
      const term = searchFilter.trim();
      const searchConditions = [
        { id: { contains: term } },
        { patientAlias: { contains: term, mode: 'insensitive' } },
        { patientFirstName: { contains: term, mode: 'insensitive' } },
        { patientLastName: { contains: term, mode: 'insensitive' } },
      ];
      
      if (!where.AND) {
        where.AND = [{ OR: searchConditions }];
      } else if (Array.isArray(where.AND)) {
        where.AND.push({ OR: searchConditions });
      } else {
        where.AND = [where.AND, { OR: searchConditions }];
      }
    }

    if (dateFilter?.trim()) {
      const d = new Date(dateFilter);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
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
            clinic: { select: { name: true, phone: true } }, 
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
    <section className="flex flex-col h-full w-full p-6 overflow-hidden bg-background text-foreground">
      <AutoRefresh intervalMs={60000} />

      <div className="flex-none space-y-4 mb-4">
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-foreground">Cases</h1>
            <span className="text-sm text-muted">Total: {totalCount}</span>
          </div>
          
          {canCreate && (
            <Link
            href="/portal/cases/new"
            className="px-4 py-2 rounded-xl bg-surface text-foreground text-sm font-semibold hover:brightness-110 hover:scale-105 transition-all shadow-md border border-border"
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