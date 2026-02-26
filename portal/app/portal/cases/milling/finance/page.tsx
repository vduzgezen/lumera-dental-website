// portal/app/portal/cases/milling/finance/page.tsx

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MillingFinanceTable from "./MillingFinanceTable";
import MillingFinanceFilters from "./MillingFinanceFilters";
import MillingFinanceStats from "./MillingFinanceStats";
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

  // ✅ NEW: Scope to milling center for milling role users
  if (session.role === "milling" && session.millingCenterId) {
    where.millingCenterId = session.millingCenterId;
  }

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

  // --- 2. Discovery & Aggregation Phase ---
  const allMatchingCases = await prisma.dentalCase.findMany({
    where,
    select: {
      shippingBatchId: true,
      shippedAt: true,
      product: true,
      material: true,
      units: true,
      shippingCost: true,
      salesRepId: true
    },
    orderBy: { shippedAt: "desc" }
  });

  // Calculate Aggregates
  let totalMilling = 0;
  let totalShipping = 0;
  let totalUnits = 0;
  
  const orderedUniqueBatchIds: string[] = [];
  const seenBatches = new Set<string>();

  for (const c of allMatchingCases) {
    if (c.shippingBatchId && !seenBatches.has(c.shippingBatchId)) {
        seenBatches.add(c.shippingBatchId);
        orderedUniqueBatchIds.push(c.shippingBatchId);
    }

    const costs = calculateProductionCosts(c.product, c.material, c.units, !!c.salesRepId);
    totalMilling += costs.milling;
    totalShipping += Number(c.shippingCost || 0);
    totalUnits += c.units;
  }

  const totalDue = totalMilling + totalShipping;
  const totalBatchCount = orderedUniqueBatchIds.length;

  // --- 3. Pagination Slice ---
  const targetBatchIds = orderedUniqueBatchIds.slice(0, limit);

  // --- 4. Data Phase: Fetch Full Data for Target Batches ---
  const cases = await prisma.dentalCase.findMany({
    where: {
      shippingBatchId: { in: targetBatchIds }
    },
    include: { clinic: true },
    orderBy: { shippedAt: "desc" }
  });

  // --- 5. Grouping & Serialization ---
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

    batchMap[bid].cases.push({
      ...c,
      cost: Number(c.cost), 
      shippingCost: c.shippingCost ? Number(c.shippingCost) : 0,
      millingFee: costs.milling
    });

    batchMap[bid].totalShipping += Number(c.shippingCost || 0);
    batchMap[bid].millingTotal += costs.milling;
  }

  const sortedBatches = targetBatchIds
    .map(id => batchMap[id])
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full space-y-6 p-6 overflow-hidden bg-background">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Milling Center Finance</h1>
          <p className="text-sm text-muted">Track production costs and shipping batch totals.</p>
        </div>
        
        <MillingFinanceFilters />
      </header>

      <MillingFinanceStats 
        totalDue={totalDue}
        totalUnits={totalUnits}
        totalBatches={totalBatchCount}
      />
      
      <MillingFinanceTable 
        batches={sortedBatches} 
        totalCount={totalBatchCount} 
        currentLimit={limit}
      />
    </div>
  );
}
