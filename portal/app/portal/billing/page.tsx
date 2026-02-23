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
  const clinicFilter = getParam("clinic") || ""; // ✅ Now represents a specific clinicId
  const isAdminOrLab = session.role === "admin" || session.role === "lab";

  const where: Prisma.DentalCaseWhereInput = {};
  
  let authorizedClinicIds: string[] = [];
  let availableClinics: { id: string; name: string }[] = [];

  // ✅ Fetch Clinics for Dropdown & Authorization
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
    
    // Fetch only authorized clinics for the dropdown
    availableClinics = await prisma.clinic.findMany({
      where: { id: { in: authorizedClinicIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  } else {
    // Fetch all clinics for admin/lab dropdown
    availableClinics = await prisma.clinic.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // ✅ Apply Clinic Filter Logic
  if (clinicFilter.trim()) {
    // If a specific clinic is chosen from the dropdown
    where.clinicId = clinicFilter.trim();
  } else if (session.role === "customer") {
    // Default to all authorized clinics if nothing is selected
    where.clinicId = { in: authorizedClinicIds };
  }

  const start = new Date(selYear, selMonth - 1, 1);
  const end = new Date(selYear, selMonth, 0, 23, 59, 59, 999);
  
  where.orderDate = { gte: start, lte: end };

  if (qFilter.trim()) {
    where.OR = [
      { patientAlias: { contains: qFilter.trim(), mode: 'insensitive' } },
      { id: { contains: qFilter.trim() } },
      { patientFirstName: { contains: qFilter.trim(), mode: 'insensitive' } },
      { patientLastName: { contains: qFilter.trim(), mode: 'insensitive' } }
    ];
  }

  if (isAdminOrLab && doctorFilter.trim()) {
    where.doctorName = { contains: doctorFilter.trim(), mode: 'insensitive' };
  }

  const showClinicFilter = isAdminOrLab || authorizedClinicIds.length > 1;
  const showClinicColumn = true;

  // --- 2. FETCH DATA ---
  const [stats, rawCases] = await Promise.all([
    prisma.dentalCase.aggregate({
        where,
        _sum: { cost: true, units: true },
        _count: { id: true }
    }),
    prisma.dentalCase.findMany({
        where,
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
      />

      <BillingStats 
        totalCost={Number(stats._sum.cost || 0)}
        caseCount={stats._count.id}
        totalUnits={stats._sum.units || 0}
      />

      <BillingList 
        cases={cases} 
        isAdminOrLab={isAdminOrLab} 
        showClinicColumn={showClinicColumn}
        totalCount={stats._count.id} 
      />
    </section>
  );
}