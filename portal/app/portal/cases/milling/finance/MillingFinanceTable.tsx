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
      <div className="flex-1 flex items-center justify-center border border-border rounded-xl bg-surface">
        <p className="text-muted">No shipped batches found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-surface overflow-hidden shadow-xl transition-colors">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface sticky top-0 backdrop-blur-md z-10 border-b border-border">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4 text-muted font-semibold">Ship Date</th>
              <th className="p-4 text-muted font-semibold">Tracking / Carrier</th>
              <th className="p-4 text-center text-muted font-semibold">Cases</th>
              <th className="p-4 text-right text-muted font-semibold">Shipping Cost</th>
              <th className="p-4 text-right text-muted font-semibold">Milling Fees</th>
              <th className="p-4 text-right text-muted font-semibold">Total Owed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((batch) => (
              <Fragment key={batch.id}>
                <tr 
                  onClick={() => toggleBatch(batch.id)}
                  className="hover:bg-[var(--accent-dim)] cursor-pointer transition-colors group"
                >
                  <td className="p-4 text-muted group-hover:text-accent">
                    {expandedBatches.has(batch.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className="p-4 font-medium text-foreground">{new Date(batch.shippedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted uppercase font-bold">{batch.carrier}</span>
                      <span className="font-mono text-blue-500">{batch.tracking}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-surface-highlight px-2 py-1 rounded border border-border text-xs text-foreground">
                      {batch.cases.length} Units
                    </span>
                  </td>
                  
                  <td className="p-4 text-right text-orange-500">{formatCurrency(batch.totalShipping)}</td>
                  <td className="p-4 text-right text-purple-500">{formatCurrency(batch.millingTotal)}</td>
                  <td className="p-4 text-right font-bold text-foreground">
                    {formatCurrency(batch.totalShipping + batch.millingTotal)}
                  </td>
                </tr>
                
                {expandedBatches.has(batch.id) && (
                  <tr>
                    <td colSpan={7} className="bg-surface-highlight p-0">
                      <div className="border-l-2 border-accent ml-6 my-2">
                        <table className="w-full text-xs text-foreground">
                          <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
                            <tr>
                              <th className="px-4 py-2">Case ID</th>
                              <th className="px-4 py-2">Clinic</th>
                              <th className="px-4 py-2">Product</th>
                              <th className="px-4 py-2 text-right">Milling Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.cases.map((c: any) => (
                              <tr key={c.id} className="border-t border-border/50">
                                <td className="px-4 py-2 font-mono text-muted">#{c.id.slice(-6)}</td>
                                <td className="px-4 py-2 font-medium">{c.clinic.name}</td>
                                <td className="px-4 py-2">{c.product} ({c.material || 'HT'})</td>
                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(c.millingFee)}</td>
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

      <div className="flex-none h-14 p-3 border-t border-border bg-surface flex items-center justify-between">
        <span className="text-xs text-muted pl-2">
          Showing {batches.length} of {totalCount} shipments
        </span>
        
        {batches.length < totalCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold text-foreground hover:text-accent px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-[var(--accent-dim)] transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}