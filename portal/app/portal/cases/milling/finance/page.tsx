// portal/app/portal/cases/milling/finance/page.tsx

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MillingFinanceTable from "./MillingFinanceTable";
import MillingFinanceFilters from "./MillingFinanceFilters";
import { calculateProductionCosts } from "@/lib/cost-engine";

export const dynamic = "force-dynamic";

export default async function MillingFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; q?: string; limit?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "milling")) {
    redirect("/portal/cases");
  }

  const sp = await searchParams;
  const year = parseInt(sp.year || new Date().getFullYear().toString());
  const month = sp.month && sp.month !== "ALL" ? parseInt(sp.month) : undefined;
  const query = sp.q?.trim() || "";
  const limit = parseInt(sp.limit || "50");

  // --- 1. Build Base Filter ---
  const where: any = {
    shippingBatchId: { not: null }
  };

  // Date Filter
  if (month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.shippedAt = { gte: start, lte: end };
  } else {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    where.shippedAt = { gte: start, lte: end };
  }

  // Text Search
  if (query) {
    where.OR = [
      { trackingNumber: { contains: query } },
      { shippingCarrier: { contains: query } },
      { shippingBatchId: { contains: query } },
      { clinic: { name: { contains: query } } }
    ];
  }

  // --- 2. Discovery Phase: Find relevant Batch IDs ---
  // We fetch minimal data to determine which batches match the criteria.
  const matchingCases = await prisma.dentalCase.findMany({
    where,
    select: { shippingBatchId: true, shippedAt: true },
    orderBy: { shippedAt: "desc" }
  });

  // Deduplicate Batch IDs (maintaining date order)
  const uniqueBatchIds = Array.from(new Set(matchingCases.map(c => c.shippingBatchId!)));
  const totalBatchCount = uniqueBatchIds.length;

  // Apply Pagination Slice
  const targetBatchIds = uniqueBatchIds.slice(0, limit);

  // --- 3. Data Phase: Fetch Full Data for Target Batches ---
  const cases = await prisma.dentalCase.findMany({
    where: {
      shippingBatchId: { in: targetBatchIds }
    },
    include: { clinic: true },
    orderBy: { shippedAt: "desc" }
  });

  // --- 4. Grouping & Serialization ---
  const batchMap: Record<string, any> = {};

  for (const c of cases) {
    const bid = c.shippingBatchId!;
    if (!batchMap[bid]) {
      batchMap[bid] = {
        id: bid,
        shippedAt: c.shippedAt,
        carrier: c.shippingCarrier,
        tracking: c.trackingNumber,
        totalShipping: 0,
        millingTotal: 0,
        cases: []
      };
    }

    const costs = calculateProductionCosts(c.product, c.material, c.units, !!c.salesRepId);
    
    // ✅ Fix: Manual serialization of Decimal to Number for client
    batchMap[bid].cases.push({
      ...c,
      cost: Number(c.cost), 
      shippingCost: c.shippingCost ? Number(c.shippingCost) : 0,
      millingFee: costs.milling
    });

    batchMap[bid].totalShipping += Number(c.shippingCost || 0);
    batchMap[bid].millingTotal += costs.milling;
  }

  // Preserve Sort Order from the ID list
  const sortedBatches = targetBatchIds
    .map(id => batchMap[id])
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full space-y-6 p-6 overflow-hidden">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Haus Finance</h1>
          <p className="text-sm text-white/40">Track milling costs and shipping batch totals.</p>
        </div>
        
        <MillingFinanceFilters />
      </header>
      
      <MillingFinanceTable 
        batches={sortedBatches} 
        totalCount={totalBatchCount} 
        currentLimit={limit}
      />
    </div>
  );
}