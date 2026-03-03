// portal/features/admin/components/BillingList.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, BillingType, formatProductName } from "@/lib/pricing";

type BillingCase = {
  id: string;
  orderDate: Date | string;
  patientAlias: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  doctorName: string | null;
  product: string;
  units: number;
  cost: number | string;
  status: string; 
  billingType: string;
  clinic: { name: string };
};

type Props = {
  cases: BillingCase[];
  isAdminOrLab: boolean;
  showClinicColumn: boolean; 
  totalCount: number;
};

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

const SortableHeader = ({ 
  label, colKey, sortConfig, onSort, align = "left", className = "", isAnySorted 
}: any) => {
  const isActive = sortConfig.key === colKey;
  
  // ✅ THE FIX: We use inset shadows instead of borders to bypass the sticky-table scrolling bug.
  let focusStyle = "";
  if (isActive) {
    focusStyle = "shadow-[inset_0_-2px_0_var(--accent)] text-[var(--accent)]";
  } else if (!isAnySorted) {
    focusStyle = "shadow-[inset_0_-2px_0_var(--foreground)] text-muted hover:text-[var(--foreground)]";
  } else {
    focusStyle = "shadow-[inset_0_0_0_transparent] text-muted hover:text-[var(--foreground)]";
  }

  return (
    <th 
      className={`
        p-4 font-medium cursor-pointer transition-all duration-200 select-none group outline-none whitespace-nowrap
        ${focusStyle}
        ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}
        ${className}
      `}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>
        {label}
        {isActive && (
          <span className="text-[var(--accent)] text-[10px] leading-none">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
};

export default function BillingList({ cases, isAdminOrLab, showClinicColumn, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ Calculate if ANY column is currently being sorted
  const isAnySorted = sortConfig.key !== null;

  const sortedCases = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return cases;
    return [...cases].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";
      switch (sortConfig.key) {
        case "date": aVal = new Date(a.orderDate).getTime(); bVal = new Date(b.orderDate).getTime(); break;
        case "clinic": aVal = a.clinic.name; bVal = b.clinic.name; break;
        case "alias": aVal = a.patientAlias; bVal = b.patientAlias; break;
        case "doctor": aVal = a.doctorName || ""; bVal = b.doctorName || ""; break;
        case "patientName": 
            aVal = `${a.patientLastName} ${a.patientFirstName}`; 
            bVal = `${b.patientLastName} ${b.patientFirstName}`; 
            break;
        case "product": aVal = a.product; bVal = b.product; break;
        case "cost": aVal = Number(a.cost); bVal = Number(b.cost); break;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [cases, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    const params = new URLSearchParams(searchParams.toString());
    const currentLimit = parseInt(params.get("limit") || "50");
    const newLimit = currentLimit + 50;
    params.set("limit", newLimit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
    setTimeout(() => setLoadingMore(false), 2000);
  };

  const colCount = 5 + (showClinicColumn ? 1 : 0) + (isAdminOrLab ? 1 : 0);

  return (
    <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-surface text-muted sticky top-0 z-10">
            <tr>
              <SortableHeader label="Created On" colKey="date" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />
              {showClinicColumn && <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />}
              <SortableHeader label="Patient Name" colKey="patientName" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />
              <SortableHeader label="Alias" colKey="alias" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />
              {isAdminOrLab && <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />}
              <SortableHeader label="Product (Units)" colKey="product" sortConfig={sortConfig} onSort={handleSort} isAnySorted={isAnySorted} />
              <SortableHeader label="Cost" colKey="cost" sortConfig={sortConfig} onSort={handleSort} align="right" isAnySorted={isAnySorted} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
             {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="p-12 text-center text-muted">
                   No records found matching your filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((c) => {
                const isWarranty = c.billingType === BillingType.WARRANTY;
                const isCancelled = c.status === "CANCELLED"; 
                const displayCost = Number(c.cost);

                return (
                  <tr key={c.id} className="hover:bg-[var(--accent-dim)] transition-colors">
                    <td className="p-4 text-muted">{new Date(c.orderDate).toLocaleDateString()}</td>
                    {showClinicColumn && <td className="p-4 text-muted">{c.clinic.name}</td>}
                    <td className="p-4 font-medium text-[var(--foreground)]">{c.patientLastName}, {c.patientFirstName}</td>
                    <td className="p-4 font-mono text-xs text-muted">{c.patientAlias}</td>
                    {isAdminOrLab && <td className="p-4 text-muted">{c.doctorName || "—"}</td>}
  
                    <td className="p-4 text-muted">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--foreground)]">{formatProductName(c.product)}</span>
                        <span className="text-xs opacity-70">({c.units} unit{c.units > 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isWarranty && <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 uppercase tracking-wide">Warranty</span>}
                        {isCancelled && <span className="px-2 py-0.5 rounded text-[10px] bg-gray-500/10 text-gray-500 border border-gray-500/20 uppercase tracking-wide">Cancelled</span>}
                      </div>
                    </td>
   
                    <td className={`p-4 text-right font-mono ${isWarranty ? "text-muted line-through" : isCancelled && displayCost === 0 ? "text-muted" : "text-emerald-600"}`}>
                      {formatCurrency(displayCost)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-none h-14 p-3 border-t border-border bg-surface flex items-center justify-between">
        <span className="text-xs text-muted pl-2">
          Showing {cases.length} of {totalCount} records
        </span>
        
        {cases.length < totalCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded-lg bg-surface border border-border hover:bg-[var(--accent-dim)] text-xs font-bold text-[var(--foreground)] transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-muted border-t-[var(--foreground)] rounded-full animate-spin" />
                Loading...
              </>
            ) : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}