// portal/app/portal/admin/financials/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateProductionCosts } from "@/lib/cost-engine";
import { AdminTabs } from "@/components/AdminTabs";
import CopyableId from "@/components/CopyableId";
import FinancialsFilters from "./FinancialsFilters";

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
  searchParams: Promise<{ month?: string; year?: string; designer?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/portal/cases");

  const sp = await searchParams;
  const now = new Date();
  
  // Filters
  const year = Number(sp.year) || now.getFullYear();
  const monthParam = sp.month; 
  
  // Default to Current Month if no param, handle "ALL" if present
  const month = monthParam ? (monthParam === "ALL" ? "ALL" : parseInt(monthParam)) : now.getMonth() + 1;

  // --- DATE RANGE LOGIC ---
  let start: Date, end: Date;
  
  if (month === "ALL") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
  } else {
      // month is number here
      const m = month as number; 
      start = new Date(year, m - 1, 1);
      end = new Date(year, m, 0, 23, 59, 59);
  }

  const designerId = sp.designer || "";

  // Build Query
  const where: any = {
    orderDate: { gte: start, lte: end },
    status: { not: "CANCELLED" },
  };

  if (designerId) {
    where.assigneeId = designerId;
  }

  // Fetch Data
  const [cases, designers] = await Promise.all([
    prisma.dentalCase.findMany({
      where,
      orderBy: { orderDate: "desc" },
      select: {
        id: true,
        patientAlias: true,
        orderDate: true,
        createdAt: true, // ✅ Required for "Date Created" column
        product: true,
        material: true,
        units: true,
        cost: true,
        status: true,
        assigneeUser: { select: { id: true, name: true, email: true } }
      }
    }),
    // Fetch list of users for filter
    prisma.user.findMany({
      where: { role: { in: ["lab", "admin"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    })
  ]);

  // Calculations
  let totalRevenue = 0;
  let totalOwedHaus = 0;
  let totalOwedDesigners = 0;

  const rows = cases.map((c) => {
    const costs = calculateProductionCosts(c.product, c.material, c.units);
    const revenue = Number(c.cost);
    
    totalRevenue += revenue;
    totalOwedHaus += costs.milling;
    totalOwedDesigners += costs.design;

    return {
      ...c,
      millingCost: costs.milling,
      designCost: costs.design,
      margin: revenue - costs.total,
      designerName: c.assigneeUser ? (c.assigneeUser.name || c.assigneeUser.email) : null
    };
  });

  const netProfit = totalRevenue - totalOwedHaus - totalOwedDesigners;

  // Dynamic Label
  const designerLabel = designerId 
    ? `Owed to ${designers.find(d => d.id === designerId)?.name?.split(' ')[0] || 'Designer'}`
    : "Owed to Designers";

  // ✅ FIX: Removed 'p-6' to align with AdminLayout padding
  // ✅ FIX: Changed 'space-y-6' to 'space-y-4' to match other tabs
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      
      {/* 1. Header (Identical to User/Clinic tabs) */}
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
        />
      </div>

      {/* 3. Scorecards */}
      <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1">Net Profit</div>
            <div className="text-2xl font-light text-white">{formatMoney(netProfit)}</div>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
                <tr>
                    {/* ✅ REQUESTED COLUMN ORDER */}
                    <th className="p-4 font-medium">Case Alias</th>
                    <th className="p-4 font-medium">Case ID</th>
                    <th className="p-4 font-medium">Date Created</th>
                    <th className="p-4 font-medium">Designer</th>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium text-center">Units</th>
                    <th className="p-4 font-medium text-right text-emerald-400">Revenue</th>
                    <th className="p-4 font-medium text-right text-blue-400">Haus Cost</th>
                    <th className="p-4 font-medium text-right text-purple-400">Design Fee</th>
                    <th className="p-4 font-medium text-right">Margin</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {rows.length === 0 && (
                    <tr>
                        <td colSpan={10} className="p-12 text-center text-white/40">No records found for this period.</td>
                    </tr>
                )}
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-medium text-white">{r.patientAlias}</td>
                        <td className="p-4">
                            <CopyableId id={r.id} truncate />
                        </td>
                        <td className="p-4 text-white/60 text-xs font-mono">
                            {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-white/70">
                            {r.designerName ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center justify-center border border-purple-500/20">
                                        {r.designerName.substring(0, 1).toUpperCase()}
                                    </div>
                                    <span className="text-xs truncate max-w-[120px]" title={r.designerName}>{r.designerName}</span>
                                </div>
                            ) : <span className="text-white/20 italic text-xs">Unassigned</span>}
                        </td>
                        <td className="p-4 text-white">
                            <div className="text-xs font-medium">{r.product.replace(/_/g, " ")}</div>
                            {r.material && <div className="text-[10px] text-white/40">{r.material}</div>}
                        </td>
                        <td className="p-4 text-center text-white/60">{r.units}</td>
                        <td className="p-4 text-right font-medium text-emerald-400/90">{formatMoney(Number(r.cost))}</td>
                        <td className="p-4 text-right text-blue-300/80">{formatMoney(r.millingCost)}</td>
                        <td className="p-4 text-right text-purple-300/80">{formatMoney(r.designCost)}</td>
                        <td className="p-4 text-right font-bold text-white/90">{formatMoney(r.margin)}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}