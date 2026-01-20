// portal/app/portal/billing/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Components
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

  // --- 1. PARSE FILTERS ---
  const getParam = (key: string) => {
    const val = sp[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const pYear = getParam("year");
  const pMonth = getParam("month");
  
  const selYear = pYear ? parseInt(pYear) : currentYear;
  const selMonth = pMonth ? parseInt(pMonth) : currentMonth;

  const qFilter = getParam("q") || "";
  const doctorFilter = getParam("doctor") || "";
  const clinicFilter = getParam("clinic") || "";

  const isAdminOrLab = session.role === "admin" || session.role === "lab";

  // --- 2. BUILD QUERY ---
  const where: Prisma.DentalCaseWhereInput = {};
  
  if (session.role === "customer") {
    // Safety check: Ensure they are linked to a clinic context (even if filtering by user)
    if (!session.clinicId) {
      return (
        <div className="p-8 text-white/50">
          Your account is not linked to a clinic. Please contact support.
        </div>
      );
    }
    // FIX: Restrict strictly to the logged-in doctor's cases, not the whole clinic
    where.doctorUserId = session.userId;
  }

  // Date Range
  const start = new Date(selYear, selMonth - 1, 1);
  const end = new Date(selYear, selMonth, 0, 23, 59, 59, 999);
  where.orderDate = { gte: start, lte: end };

  // Search
  if (qFilter.trim()) {
    const q = qFilter.trim();
    where.OR = [
      { patientAlias: { contains: q } },
      { id: { contains: q } },
    ];
  }

  // Admin Filters
  if (isAdminOrLab) {
    if (doctorFilter.trim()) where.doctorName = { contains: doctorFilter.trim() };
    if (clinicFilter.trim()) where.clinic = { name: { contains: clinicFilter.trim() } };
  }

  // --- 3. FETCH DATA ---
  const rawCases = await prisma.dentalCase.findMany({
    where,
    orderBy: { orderDate: "desc" },
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

  // --- 4. TRANSFORM & CALCULATE ---
  // FIX: Convert Prisma 'Decimal' to plain 'number' for Client Component safety
  const cases = rawCases.map((c) => ({
    ...c,
    cost: Number(c.cost), // <--- SERIALIZATION FIX
  }));

  const totalCost = cases.reduce((sum, c) => sum + c.cost, 0);
  const totalUnits = cases.reduce((sum, c) => sum + (c.units || 0), 0);

  const isFiltered = 
    !!qFilter || 
    (isAdminOrLab && (!!doctorFilter || !!clinicFilter)) || 
    selYear !== currentYear || 
    selMonth !== currentMonth;

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
        totalCost={totalCost}
        caseCount={cases.length}
        totalUnits={totalUnits}
      />

      <BillingList cases={cases} isAdminOrLab={isAdminOrLab} />
    </section>
  );
}