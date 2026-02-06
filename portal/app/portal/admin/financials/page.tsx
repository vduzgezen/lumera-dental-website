// portal/app/portal/admin/financials/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateProductionCosts } from "@/lib/cost-engine";
import { AdminTabs } from "@/components/AdminTabs";
import FinancialsFilters from "./FinancialsFilters";
import FinancialsTable from "./FinancialsTable"; 

export const dynamic = "force-dynamic";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; designer?: string; salesRep?: string; doctor?: string; clinic?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/portal/cases");

  const sp = await searchParams;
  const now = new Date();

  // Filters
  const year = Number(sp.year) || now.getFullYear();
  const monthParam = sp.month; 
  const month = monthParam ? (monthParam === "ALL" ? "ALL" : parseInt(monthParam)) : now.getMonth() + 1;
  
  // --- DATE RANGE LOGIC ---
  let start: Date, end: Date;
  if (month === "ALL") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
  } else {
      const m = month as number;
      start = new Date(year, m - 1, 1);
      end = new Date(year, m, 0, 23, 59, 59);
  }

  const designerId = sp.designer || "";
  const salesRepId = sp.salesRep || "";
  const doctorFilter = sp.doctor || "";
  const clinicFilter = sp.clinic || "";

  // Build Query
  const where: any = {
    orderDate: { gte: start, lte: end },
    status: { not: "CANCELLED" },
  };
  
  if (designerId) where.assigneeId = designerId;
  if (salesRepId) where.salesRepId = salesRepId;
  if (doctorFilter) where.doctorName = { contains: doctorFilter, mode: 'insensitive' };
  if (clinicFilter) where.clinic = { name: { contains: clinicFilter, mode: 'insensitive' } };

  // Fetch Data
  const [cases, designers, salesReps] = await Promise.all([
    prisma.dentalCase.findMany({
      where,
      orderBy: { orderDate: "desc" },
      select: {
        id: true,
        patientAlias: true,
        orderDate: true,
        createdAt: true,
        product: true,
        material: true,
        units: true,
        cost: true,
        status: true,
        salesRepId: true, 
        doctorName: true,
        clinic: { select: { name: true } },
        assigneeUser: { select: { id: true, name: true, email: true } },
        salesRep: { select: { id: true, name: true, email: true } } 
      }
    }),
    prisma.user.findMany({
      where: { role: { in: ["lab", "admin"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    }),
    prisma.user.findMany({
      where: { role: "sales" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    })
  ]);

  // Calculations
  let totalRevenue = 0;
  let totalOwedHaus = 0;
  let totalOwedDesigners = 0;
  let totalOwedSales = 0;
  let totalUnits = 0; 

  const rows = cases.map((c) => {
    const costs = calculateProductionCosts(c.product, c.material, c.units, !!c.salesRepId);
    // Convert Decimal to Number immediately
    const revenue = Number(c.cost);
    
    totalRevenue += revenue;
    totalOwedHaus += costs.milling;
    totalOwedDesigners += costs.design;
    totalOwedSales += costs.commission;
    totalUnits += c.units;

    return {
      ...c,
      cost: revenue, // ✅ FIX: Overwrite the Decimal object with a plain number
      millingCost: costs.milling,
      designCost: costs.design,
      commissionCost: costs.commission, 
      margin: revenue - costs.total,
      designerName: c.assigneeUser ? (c.assigneeUser.name || c.assigneeUser.email) : null,
      salesRepName: c.salesRep ? (c.salesRep.name || c.salesRep.email) : null
    };
  });

  const netProfit = totalRevenue - totalOwedHaus - totalOwedDesigners - totalOwedSales;

  // Dynamic Labels
  const designerLabel = designerId 
    ? `Owed to ${designers.find(d => d.id === designerId)?.name?.split(' ')[0] || 'Designer'}`
    : "Owed to Designers";
  
  const salesLabel = salesRepId
    ? `Owed to ${salesReps.find(r => r.id === salesRepId)?.name?.split(' ')[0] || 'Rep'}`
    : "Sales Comm.";

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      
      {/* 1. Header */}
      <div className="flex-none flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-white hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <AdminTabs />
         </div>
      </div>

      {/* 2. Filters & Controls */}
      <div className="flex-none">
        <FinancialsFilters 
          selYear={year} 
          selMonth={month} 
          designerId={designerId} 
          designers={designers}
          salesRepId={salesRepId}
          salesReps={salesReps} 
          doctorFilter={doctorFilter}
          clinicFilter={clinicFilter}
        />
      </div>

      {/* 3. Scorecards */}
      <div className="flex-none grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-1">Total Revenue</div>
            <div className="text-2xl font-light text-white">{formatMoney(totalRevenue)}</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Owed to Haus</div>
            <div className="text-2xl font-light text-white">{formatMoney(totalOwedHaus)}</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">{designerLabel}</div>
            <div className="text-2xl font-light text-white">{formatMoney(totalOwedDesigners)}</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-1">{salesLabel}</div>
            <div className="text-2xl font-light text-white">{formatMoney(totalOwedSales)}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Net Profit</div>
            <div className="text-2xl font-light text-white">{formatMoney(netProfit)}</div>
        </div>
      </div>

      {/* 4. Client Side Table with Sorting */}
      <FinancialsTable rows={rows} />

      {/* 5. Bottom Summary Footer */}
      <div className="flex-none p-2 border-t border-white/5 bg-white/[0.02] text-center text-xs text-white/40">
          Showing {rows.length} cases with a total of {totalUnits} units.
      </div>
    </div>
  );
}