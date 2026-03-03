// portal/app/portal/billing/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import BillingToolbar from "@/features/admin/components/BillingToolbar";
import BillingStats from "@/features/admin/components/BillingStats";
import BillingList from "@/features/admin/components/BillingList";

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
  const isAdminOrLab = session.role === "admin" || session.role === "lab";

  let authorizedClinicIds: string[] = [];
  let availableClinics: { id: string; name: string }[] = [];

  if (session.role === "customer") {
    const userRecord = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { secondaryClinics: { select: { id: true } } }
    });
    if (userRecord?.clinicId) authorizedClinicIds.push(userRecord.clinicId);
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

  // --- 1. BASE WHERE (Only Date & Clinic) ---
  const baseWhere: Prisma.DentalCaseWhereInput = {
    orderDate: { gte: start, lte: end }
  };

  if (clinicFilter.trim()) {
    baseWhere.clinicId = clinicFilter.trim();
  } else if (session.role === "customer") {
    baseWhere.clinicId = { in: authorizedClinicIds };
  }

  // --- 2. FILTERED WHERE (Adds UI Filters) ---
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

  const showClinicFilter = isAdminOrLab || authorizedClinicIds.length > 1;
  const showClinicColumn = true;

  // --- 3. FETCH DATA ---
  const [statementStats, filteredStats, rawCases] = await Promise.all([
    // Query 1: Absolute total for the month
    prisma.dentalCase.aggregate({
        where: baseWhere,
        _sum: { cost: true }
    }),
    // Query 2: Stats for the currently filtered table
    prisma.dentalCase.aggregate({
        where: filteredWhere,
        _sum: { cost: true, units: true },
        _count: { id: true }
    }),
    // Query 3: Actual cases for the table
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

  const isFiltered = !!qFilter || (isAdminOrLab && !!doctorFilter) || !!clinicFilter || selYear !== currentYear || selMonth !== currentMonth;
  const activeClinicId = clinicFilter.trim() || (authorizedClinicIds.length === 1 ? authorizedClinicIds[0] : null);

  // ✅ Extract the unshakeable total for the Pay Button
  let trueMonthlyTotal = Number(statementStats._sum.cost || 0);

  // ✅ Check if an invoice exists and is PAID. If so, set the total to 0!
  if (activeClinicId) {
    const currentInvoice = await prisma.invoice.findFirst({
      where: { 
        clinicId: activeClinicId, 
        periodStart: { gte: start }, 
        periodEnd: { lte: end } 
      }
    });
    
    if (currentInvoice?.status === "PAID") {
      trueMonthlyTotal = 0; // This instantly flips the pill to AMOUNT PAID and hides the button
    }
  }

  const showPayButton = session.role === "customer" && !!activeClinicId && trueMonthlyTotal > 0;

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      <BillingToolbar 
        selYear={selYear}
        selMonth={selMonth}
        qFilter={qFilter}
        doctorFilter={doctorFilter}
        clinicFilter={clinicFilter}
        availableClinics={availableClinics}
        isAdminOrLab={isAdminOrLab}
        showClinicFilter={showClinicFilter}
        isFiltered={isFiltered}
        showPayButton={showPayButton}
        activeClinicId={activeClinicId}
        totalOwed={trueMonthlyTotal}
      />

      {/* ✅ STATS & PAYMENT HEADER with restored mb-4 spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-2">
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