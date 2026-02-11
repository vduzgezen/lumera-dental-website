// portal/app/portal/cases/milling/finance/MillingFinanceTable.tsx
"use client";

import { useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

export default function MillingFinanceTable({ 
  batches, 
  totalCount, 
  currentLimit 
}: { 
  batches: any[], 
  totalCount: number, 
  currentLimit: number 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);

  const toggleBatch = (id: string) => {
    const next = new Set(expandedBatches);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedBatches(next);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    const params = new URLSearchParams(searchParams.toString());
    const newLimit = currentLimit + 10;
    params.set("limit", newLimit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
    setTimeout(() => setLoadingMore(false), 1000);
  };

  if (batches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border border-white/10 rounded-xl bg-black/20">
        <p className="text-white/40">No shipped batches found.</p>
      </div>
    );
  }

  return (
    // ✅ FIX: Rounded corners & Overflow
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden shadow-xl">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Ship Date</th>
              <th className="p-4">Tracking / Carrier</th>
              <th className="p-4 text-center">Cases</th>
              <th className="p-4 text-right">Shipping Cost</th>
              <th className="p-4 text-right">Milling Fees</th>
              <th className="p-4 text-right">Total Owed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {batches.map((batch) => (
              <Fragment key={batch.id}>
                <tr 
                  onClick={() => toggleBatch(batch.id)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="p-4">
                    {expandedBatches.has(batch.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className="p-4 font-medium">{new Date(batch.shippedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-white/40 uppercase font-bold">{batch.carrier}</span>
                      <span className="font-mono text-blue-400">{batch.tracking}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-white/5 px-2 py-1 rounded border border-white/10 text-xs">
                      {batch.cases.length} Units
                    </span>
                  </td>
                  <td className="p-4 text-right text-orange-400">{formatCurrency(batch.totalShipping)}</td>
                  <td className="p-4 text-right text-purple-400">{formatCurrency(batch.millingTotal)}</td>
                  <td className="p-4 text-right font-bold text-white">
                    {formatCurrency(batch.totalShipping + batch.millingTotal)}
                  </td>
                </tr>
                {expandedBatches.has(batch.id) && (
                  <tr>
                    <td colSpan={7} className="bg-black/40 p-0">
                      <div className="border-l-2 border-accent ml-6 my-2">
                        <table className="w-full text-xs text-white/60">
                          <thead className="text-[10px] uppercase tracking-wider text-white/30">
                            <tr>
                              <th className="px-4 py-2">Case ID</th>
                              <th className="px-4 py-2">Clinic</th>
                              <th className="px-4 py-2">Product</th>
                              <th className="px-4 py-2 text-right">Milling Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.cases.map((c: any) => (
                              <tr key={c.id} className="border-t border-white/5">
                                <td className="px-4 py-2 font-mono">#{c.id.slice(-6)}</td>
                                <td className="px-4 py-2">{c.clinic.name}</td>
                                <td className="px-4 py-2">{c.product} ({c.material || 'HT'})</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(c.millingFee)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ FIX: Fixed Height Footer (h-14) */}
      <div className="flex-none h-14 p-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
        <span className="text-xs text-white/40 pl-2">
          Showing {batches.length} of {totalCount} shipments
        </span>
        
        {batches.length < totalCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}