// portal/components/BillingStats.tsx
"use client";

import { formatCurrency } from "@/lib/pricing";

type Props = {
  totalCost: number;
  caseCount: number;
  totalUnits: number;
  trueMonthlyTotal: number; 
  selMonth: number;
  selYear: number;
};

export default function BillingStats({ totalCost, caseCount, totalUnits, trueMonthlyTotal, selMonth, selYear }: Props) {
  
  // --- Billing Status Logic ---
  let statusText = "NO ACTIVITY";
  let statusColor = "bg-surface-highlight text-muted border-border";

  if (caseCount > 0) {
    if (trueMonthlyTotal <= 0) {
      statusText = "AMOUNT PAID";
      statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
    } else {
      // Find the absolute last millisecond of the selected billing month
      const endOfBillingMonth = new Date(selYear, selMonth, 0, 23, 59, 59, 999);
      
      // Calculate Net 30 Due Date
      const dueDate = new Date(endOfBillingMonth);
      dueDate.setDate(dueDate.getDate() + 30);
      
      const now = new Date();

      if (now <= endOfBillingMonth) {
        statusText = "BILLING WINDOW OPEN";
        statusColor = "bg-[#9696e2]/10 text-[#9696e2] border-[#9696e2]/30";
      } else if (now > dueDate) {
        statusText = "OVERDUE";
        statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
      } else {
        statusText = "PAYMENT DUE";
        statusColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
      }
    }
  }

  return (
    // ✅ Note: mb-8 is intentionally removed here so the parent controls the gap
    <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
        <div className="text-sm text-muted mb-1 font-medium">Total Cost (Filtered)</div>
        <div className="text-4xl font-light text-[var(--accent)]">
          {formatCurrency(totalCost)}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center">
        <div className="text-sm text-muted mb-1 font-medium">Cases & Units</div>
        <div className="text-4xl font-light text-[var(--foreground)] flex items-baseline gap-2">
          {caseCount} <span className="text-2xl font-normal">cases,</span>
          <span className="text-xl text-muted font-normal ml-1">
            {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center items-start">
        <div className="text-sm text-muted mb-3 font-medium">Statement Status</div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-widest border uppercase ${statusColor}`}>
          {statusText}
        </div>
      </div>
    </div>
  );
}