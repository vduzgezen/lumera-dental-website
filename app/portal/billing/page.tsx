// app/portal/billing/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import BillingToolbar from "@/features/admin/components/BillingToolbar";
import BillingStats from "@/features/admin/components/BillingStats";
import BillingList from "@/features/admin/components/BillingList";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;

  const getParam = (key: string) => {
    const val = sp[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const selYear = getParam("year") ? parseInt(getParam("year")!) : currentYear;
  const selMonth = getParam("month") ? parseInt(getParam("month")!) : currentMonth;
  const limit = parseInt(getParam("limit") || "50");

  const qFilter = getParam("q") || "";
  const doctorFilter = getParam("doctor") || "";
  const clinicFilter = getParam("clinic") || ""; 
  const personalFilter = getParam("personal") === "true";
  
  const isAdminOrLab = session.role === "admin" || session.role === "lab";

  const cookieJar = await cookies();
  const savedClinicCookie = cookieJar.get("lumera_active_clinic")?.value;

  let authorizedClinicIds: string[] = [];
  let availableClinics: { id: string; name: string }[] = [];
  let primaryClinicId: string | null = null;

  if (session.role === "customer") {
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

    if (authorizedClinicIds.length === 0) {
      return <div className="p-8 text-muted">No clinic linked. Contact support.</div>;
    }
    
    availableClinics = await prisma.clinic.findMany({
      where: { id: { in: authorizedClinicIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  } else {
    availableClinics = await prisma.clinic.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  const start = new Date(selYear, selMonth - 1, 1);
  const end = new Date(selYear, selMonth, 0, 23, 59, 59, 999);

  let activeClinicId = clinicFilter.trim() || savedClinicCookie || "";
  if (!activeClinicId && session.role === "customer") {
    activeClinicId = primaryClinicId || authorizedClinicIds[0];
  } else if (!activeClinicId && authorizedClinicIds.length === 1) {
    activeClinicId = authorizedClinicIds[0];
  }

  if (session.role === "customer" && !authorizedClinicIds.includes(activeClinicId)) {
      activeClinicId = primaryClinicId || authorizedClinicIds[0];
  }

  const activeClinicName = availableClinics.find(c => c.id === activeClinicId)?.name || "";

  const baseWhere: Prisma.DentalCaseWhereInput = {
    orderDate: { gte: start, lte: end }
  };

  if (activeClinicId) {
    baseWhere.clinicId = activeClinicId;
  } else if (session.role === "customer") {
    baseWhere.clinicId = { in: authorizedClinicIds };
  }

  const filteredWhere: Prisma.DentalCaseWhereInput = { ...baseWhere };

  if (qFilter.trim()) {
    filteredWhere.OR = [
      { patientAlias: { contains: qFilter.trim(), mode: 'insensitive' } },
      { id: { contains: qFilter.trim() } },
      { patientFirstName: { contains: qFilter.trim(), mode: 'insensitive' } },
      { patientLastName: { contains: qFilter.trim(), mode: 'insensitive' } }
    ];
  }

  if (isAdminOrLab && doctorFilter.trim()) {
    filteredWhere.doctorName = { contains: doctorFilter.trim(), mode: 'insensitive' };
  }

  if (session.role === "customer" && personalFilter) {
    filteredWhere.doctorUserId = session.userId;
  }

  const showClinicFilter = isAdminOrLab; 
  const showClinicColumn = isAdminOrLab || authorizedClinicIds.length > 1;

  const [statementStats, filteredStats, rawCases] = await Promise.all([
    prisma.dentalCase.aggregate({
        where: baseWhere,
        _sum: { cost: true }
    }),
    prisma.dentalCase.aggregate({
        where: filteredWhere,
        _sum: { cost: true, units: true },
        _count: { id: true }
    }),
    prisma.dentalCase.findMany({
        where: filteredWhere,
        orderBy: { orderDate: "desc" },
        take: limit, 
        select: {
            id: true,
            orderDate: true,
            patientAlias: true,
            patientFirstName: true,
            patientLastName: true,
            doctorName: true,
            product: true,
            units: true,
            cost: true,
            status: true,
            billingType: true,
            clinic: { select: { name: true } },
        },
    })
  ]);

  const cases = rawCases.map((c) => ({
    ...c,
    cost: Number(c.cost),
  }));

  const isFiltered = !!qFilter || (isAdminOrLab && !!doctorFilter) || !!clinicFilter || selYear !== currentYear || selMonth !== currentMonth || personalFilter;

  let trueMonthlyTotal = Number(statementStats._sum.cost || 0);

  if (activeClinicId) {
    const currentInvoice = await prisma.invoice.findFirst({
      where: { 
        clinicId: activeClinicId, 
        periodStart: { gte: start }, 
        periodEnd: { lte: end } 
      }
    });

    if (currentInvoice?.status === "PAID") {
      trueMonthlyTotal = 0;
    }
  }

  const showPayButton = session.role === "customer" && !!activeClinicId && trueMonthlyTotal > 0 && !personalFilter;

  return (
    // ✅ CHANGED: Replaced p-6 with px-6 pb-6 pt-0 to lock flush with the top edge
    <section className="h-screen w-full flex flex-col px-6 pb-6 pt-0 overflow-hidden">
      <BillingToolbar 
        selYear={selYear}
        selMonth={selMonth}
        qFilter={qFilter}
        doctorFilter={doctorFilter}
        clinicFilter={activeClinicId || ""}
        personalFilter={personalFilter} 
        availableClinics={availableClinics}
        isAdminOrLab={isAdminOrLab}
        showClinicFilter={showClinicFilter}
        isFiltered={isFiltered}
        showPayButton={showPayButton}
        activeClinicId={activeClinicId}
        activeClinicName={activeClinicName} 
        totalOwed={trueMonthlyTotal}
        sessionRole={session.role} 
      />

      {/* ✅ CHANGED: Removed margins so the exact layout gap handles the alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
        <div className="w-full">
          <BillingStats 
            totalCost={Number(filteredStats._sum.cost || 0)}
            caseCount={filteredStats._count.id}
            totalUnits={filteredStats._sum.units || 0}
            trueMonthlyTotal={trueMonthlyTotal}
            selMonth={selMonth}
            selYear={selYear}
          />
        </div>
      </div>

      <BillingList 
        cases={cases} 
        isAdminOrLab={isAdminOrLab} 
        showClinicColumn={showClinicColumn}
        totalCount={filteredStats._count.id} 
      />
    </section>
  );
}