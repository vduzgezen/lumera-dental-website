// portal/app/portal/cases/milling/finance/MillingFinanceStats.tsx
"use client";

import { formatCurrency } from "@/lib/pricing";

interface Props {
  totalDue: number;
  totalUnits: number;
  totalBatches: number;
}

export default function MillingFinanceStats({ totalDue, totalUnits, totalBatches }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      {/* Total Due Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/60">Total Due</span>
        </div>
        <div className="text-3xl font-light text-white tracking-tight text-center">
          {formatCurrency(totalDue)}
        </div>
      </div>

      {/* Units Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/60">Total Units</span>
        </div>
        <div className="text-3xl font-light text-white tracking-tight text-center">
          {totalUnits}
        </div>
      </div>

      {/* Shipments Card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/60">Shipments</span>
        </div>
        <div className="text-3xl font-light text-white tracking-tight text-center">
          {totalBatches}
        </div>
      </div>
    </div>
  );
}