// portal/app/portal/billing/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import BillingToolbar from "@/components/BillingToolbar";
import BillingStats from "@/components/BillingStats";
import BillingList from "@/components/BillingList";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;

  // --- 1. FILTERS ---
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

  const qFilter = getParam("q") || "";
  const doctorFilter = getParam("doctor") || "";
  const clinicFilter = getParam("clinic") || "";
  const isAdminOrLab = session.role === "admin" || session.role === "lab";

  const where: Prisma.DentalCaseWhereInput = {};
  
  if (session.role === "customer") {
    if (!session.clinicId) {
      return <div className="p-8 text-white/50">No clinic linked. Contact support.</div>;
    }
    where.doctorUserId = session.userId;
  }

  const start = new Date(selYear, selMonth - 1, 1);
  const end = new Date(selYear, selMonth, 0, 23, 59, 59, 999);
  where.orderDate = { gte: start, lte: end };

  if (qFilter.trim()) {
    where.OR = [
      { patientAlias: { contains: qFilter.trim() } },
      { id: { contains: qFilter.trim() } },
    ];
  }

  if (isAdminOrLab) {
    if (doctorFilter.trim()) where.doctorName = { contains: doctorFilter.trim() };
    if (clinicFilter.trim()) where.clinic = { name: { contains: clinicFilter.trim() } };
  }

  // --- 2. OPTIMIZED FETCH ---
  // A. Get Totals via Aggregation (FAST, instead of iterating JS)
  const stats = await prisma.dentalCase.aggregate({
    where,
    _sum: {
        cost: true,
        units: true
    },
    _count: {
        id: true
    }
  });

  // B. Get Recent Cases (Limit to 100 to prevent crashes)
  const rawCases = await prisma.dentalCase.findMany({
    where,
    orderBy: { orderDate: "desc" },
    take: 100, // ✅ LIMIT: Prevent rendering 5,000 rows
    select: {
      id: true,
      orderDate: true,
      patientAlias: true,
      doctorName: true,
      product: true,
      units: true,
      cost: true,
      billingType: true,
      clinic: { select: { name: true } },
    },
  });

  const cases = rawCases.map((c) => ({
    ...c,
    cost: Number(c.cost),
  }));

  const isFiltered = !!qFilter || (isAdminOrLab && (!!doctorFilter || !!clinicFilter)) || selYear !== currentYear || selMonth !== currentMonth;

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      <BillingToolbar 
        selYear={selYear}
        selMonth={selMonth}
        qFilter={qFilter}
        doctorFilter={doctorFilter}
        clinicFilter={clinicFilter}
        isAdminOrLab={isAdminOrLab}
        isFiltered={isFiltered}
      />

      <BillingStats 
        // ✅ Use DB Aggregates (Fast)
        totalCost={Number(stats._sum.cost || 0)}
        caseCount={stats._count.id}
        totalUnits={stats._sum.units || 0}
      />

      <BillingList cases={cases} isAdminOrLab={isAdminOrLab} />
      {stats._count.id > 100 && (
        <p className="text-center text-xs text-white/30 pt-2">
            Showing recent 100 of {stats._count.id} records. Export to CSV for full history.
        </p>
      )}
    </section>
  );
}