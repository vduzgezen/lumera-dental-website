// portal/components/BillingStats.tsx
"use client";

import { formatCurrency } from "@/lib/pricing";

type Props = {
  totalCost: number;
  caseCount: number;
  totalUnits: number;
};

export default function BillingStats({ totalCost, caseCount, totalUnits }: Props) {
  return (
    <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="text-sm text-muted mb-1">Total Cost (Filtered)</div>
        <div className="text-4xl font-light text-accent">
          {formatCurrency(totalCost)}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="text-sm text-muted mb-1">Cases Processed</div>
        <div className="text-4xl font-light text-foreground">{caseCount}</div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="text-sm text-muted mb-1">Total Units</div>
        <div className="text-4xl font-light text-blue-500">{totalUnits}</div>
      </div>
    </div>
  );
}
