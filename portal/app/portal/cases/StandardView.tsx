// app/portal/cases/StandardView.tsx
import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/components/ui/AutoRefresh";
import CaseListClient from "./CaseListClient";
import CasesFilterBar from "./CasesFilterBar";
import { CaseRow } from "./types";
import { cookies } from "next/headers";

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
  const isLab = role === "lab";
  const currentRole = role as string;
  const canCreate = currentRole === "lab" || currentRole === "admin";
  const canFilterAssignee = isAdmin || isLab;

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
  
  const unreadFilter = getParam("unread") === "true";
  const actionFilter = getParam("action") === "true";
  
  // ✅ Extract the global cookie
  const cookieJar = await cookies();
  const savedClinicCookie = cookieJar.get("lumera_active_clinic")?.value;

  // ✅ 1. CLINIC SCOPING LOGIC
  let authorizedClinicIds: string[] = [];
  let availableClinics: { id: string; name: string }[] = [];
  let primaryClinicId: string | null = null;

  if (isDoctor) {
    const userRecord = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { secondaryClinics: { select: { id: true } } }
    });

    if (userRecord?.clinicId) {
      authorizedClinicIds.push(userRecord.clinicId);
      primaryClinicId = userRecord.clinicId;
    }
    if (userRecord?.secondaryClinics) {
      userRecord.secondaryClinics.forEach(c => authorizedClinicIds.push(c.id));
    }
    
    availableClinics = await prisma.clinic.findMany({
      where: { id: { in: authorizedClinicIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  const baseWhere: any = {};
  
  let activeClinicId = "";
  if (isDoctor) {
    // Order of precedence: URL Param -> Global Cookie -> Primary Clinic -> First Available
    activeClinicId = clinicFilter?.trim() || savedClinicCookie || primaryClinicId || authorizedClinicIds[0] || "";
    
    // Security check: ensure the cookie/param isn't maliciously requesting an unauthorized clinic
    if (!authorizedClinicIds.includes(activeClinicId)) {
       activeClinicId = primaryClinicId || authorizedClinicIds[0] || "";
    }

    if (activeClinicId) {
      baseWhere.clinicId = activeClinicId;
    } else {
      baseWhere.clinicId = { in: authorizedClinicIds };
    }

    // ✅ CRITICAL PRIVACY FIX: Doctors strictly only see their OWN cases.
    baseWhere.doctorUserId = session.userId;
  }

  const activeClinicName = availableClinics.find(c => c.id === activeClinicId)?.name || "";

  // Apply other text searches
  if (isDoctor) {
    const query = searchFilter || aliasFilter;
    if (query && query.trim()) {
      baseWhere.AND = {
        OR: [
            { id: { contains: query.trim() } },
            { patientAlias: { contains: query.trim(), mode: 'insensitive' } },
            { product: { contains: query.trim(), mode: 'insensitive' } },
            { patientFirstName: { contains: query.trim(), mode: 'insensitive' } },
            { patientLastName: { contains: query.trim(), mode: 'insensitive' } }
        ]
      };
    }
  } else if (currentRole === "sales") {
    baseWhere.salesRepId = session.userId;
  } else {
    // Admins use text-based clinic filtering
    if (clinicFilter?.trim()) baseWhere.clinic = { name: { contains: clinicFilter.trim(), mode: 'insensitive' } };
    if (doctorFilter?.trim()) baseWhere.doctorName = { contains: doctorFilter.trim(), mode: 'insensitive' };
    if (caseIdFilter?.trim()) baseWhere.id = { contains: caseIdFilter.trim() };
    if (canFilterAssignee && assigneeFilter?.trim()) {
        baseWhere.assigneeId = assigneeFilter.trim();
    }

    if (searchFilter?.trim()) {
      const term = searchFilter.trim();
      const searchConditions = [
        { id: { contains: term } },
        { patientAlias: { contains: term, mode: 'insensitive' } },
        { product: { contains: term, mode: 'insensitive' } },
        { patientFirstName: { contains: term, mode: 'insensitive' } },
        { patientLastName: { contains: term, mode: 'insensitive' } },
      ];
      if (!baseWhere.AND) {
        baseWhere.AND = [{ OR: searchConditions }];
      } else if (Array.isArray(baseWhere.AND)) {
        baseWhere.AND.push({ OR: searchConditions });
      } else {
        baseWhere.AND = [baseWhere.AND, { OR: searchConditions }];
      }
    }

    if (dateFilter?.trim()) {
      const d = new Date(dateFilter);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        baseWhere.dueDate = { gte: start, lt: end };
      }
    }
  }

  // ✅ 2. CALCULATE STABLE TRIAGE COUNTS
  const roleTarget = isDoctor ? "DOCTOR" : "LAB";
  
  const triageCases = await prisma.dentalCase.findMany({
      where: baseWhere,
      select: { status: true, actionRequiredBy: true, unreadForDoctor: true, unreadForLab: true }
  });

  const actionCount = triageCases.filter(c => c.actionRequiredBy === roleTarget && c.status !== "CANCELLED").length;
  const unreadCount = triageCases.filter(c => (isDoctor ? c.unreadForDoctor : c.unreadForLab) && c.status !== "CANCELLED").length;
  const shippedCount = triageCases.filter(c => c.status === "SHIPPED").length;


  // ✅ 3. BUILD THE TABLE WHERE
  const tableWhere = { ...baseWhere };

  if (statusFilter.length > 0) {
    const expandedStatuses = [...statusFilter];
    if (expandedStatuses.includes("IN_DESIGN") && !expandedStatuses.includes("READY_FOR_REVIEW")) {
        expandedStatuses.push("READY_FOR_REVIEW");
    }
    tableWhere.status = { in: expandedStatuses };
  } else if (!unreadFilter && !actionFilter) {
    if (isDoctor) {
        tableWhere.status = { notIn: ["DELIVERED"] };
    } else {
        tableWhere.status = { notIn: ["COMPLETED", "DELIVERED"] };
    }
  }

  if (unreadFilter) {
      if (isDoctor) tableWhere.unreadForDoctor = true;
      else tableWhere.unreadForLab = true;
  }

  if (actionFilter) {
      tableWhere.actionRequiredBy = roleTarget;
  }

  // ✅ 4. FETCH TABLE DATA
  let labUsers: { id: string; name: string | null; email: string }[] = [];
  if (canFilterAssignee) {
    labUsers = await prisma.user.findMany({
        where: { role: { in: ["lab", "admin"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" }
    });
  }

  const [totalCount, rows] = await Promise.all([
    prisma.dentalCase.count({ where: tableWhere }),
    prisma.dentalCase.findMany({
        where: tableWhere,
        orderBy: [
            { actionRequiredBy: "desc" }, 
            { updatedAt: "desc" }
        ],
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
            units: true,
            material: true,
            serviceLevel: true,
            actionRequiredBy: true,
            unreadForDoctor: true,
            unreadForLab: true,
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

  const fullySortedRows = rows.sort((a, b) => {
    const aNeedsAction = a.actionRequiredBy === roleTarget;
    const bNeedsAction = b.actionRequiredBy === roleTarget;
    if (aNeedsAction && !bNeedsAction) return -1;
    if (!aNeedsAction && bNeedsAction) return 1;

    const aUnread = isDoctor ? a.unreadForDoctor : a.unreadForLab;
    const bUnread = isDoctor ? b.unreadForDoctor : b.unreadForLab;
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <section className="flex flex-col h-full w-full px-6 pb-6 pt-0 overflow-hidden bg-background text-foreground">
      <AutoRefresh intervalMs={60000} />

      <CasesFilterBar 
        role={role}
        isAdmin={isAdmin}
        isDoctor={isDoctor}
        labUsers={labUsers}
        canCreate={canCreate}
        availableClinics={availableClinics}
        activeClinicId={activeClinicId}
        activeClinicName={activeClinicName}
        totalCount={totalCount}
        actionCount={actionCount}
        unreadCount={unreadCount}
        shippedCount={shippedCount}
      />

      <CaseListClient 
        cases={fullySortedRows as CaseRow[]} 
        role={role} 
        totalCount={totalCount}
      />
    </section>
  );
}