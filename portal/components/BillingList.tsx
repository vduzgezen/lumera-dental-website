// portal/components/BillingList.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, BillingType } from "@/lib/pricing";

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
  billingType: string;
  clinic: { name: string };
};

type Props = {
  cases: BillingCase[];
  isAdminOrLab: boolean;
  totalCount: number; // ✅
};

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

const SortableHeader = ({ 
  label, colKey, sortConfig, onSort, align = "left", className = ""
}: any) => {
  const isActive = sortConfig.key === colKey;
  return (
    <th 
      className={`
        p-4 font-medium cursor-pointer transition-colors select-none group border-b-2 outline-none whitespace-nowrap
        ${isActive ? "text-white border-accent" : "border-transparent hover:text-white"}
        ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}
        ${className}
      `}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>
        {label}
        {isActive && (
          <span className="text-accent text-[10px] leading-none">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
};

export default function BillingList({ cases, isAdminOrLab, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [loadingMore, setLoadingMore] = useState(false);

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
        case "units": aVal = a.units; bVal = b.units; break;
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

  return (
    // ✅ FIX: Rounded corners & Overflow handling
    <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
            <tr>
              <SortableHeader label="Created On" colKey="date" sortConfig={sortConfig} onSort={handleSort} />
              {isAdminOrLab && <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} />}
              <SortableHeader label="Patient Name" colKey="patientName" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Alias" colKey="alias" sortConfig={sortConfig} onSort={handleSort} />
              {isAdminOrLab && <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={handleSort} />}
              <SortableHeader label="Product" colKey="product" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Units" colKey="units" sortConfig={sortConfig} onSort={handleSort} align="center" />
              <SortableHeader label="Cost" colKey="cost" sortConfig={sortConfig} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
             {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={isAdminOrLab ? 8 : 6} className="p-12 text-center text-white/40">
                   No records found matching your filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((c) => {
                const isWarranty = c.billingType === BillingType.WARRANTY;
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white/70">{new Date(c.orderDate).toLocaleDateString()}</td>
                    {isAdminOrLab && <td className="p-4 text-white/70">{c.clinic.name}</td>}
                    <td className="p-4 font-medium text-white">{c.patientLastName}, {c.patientFirstName}</td>
                    <td className="p-4 font-mono text-xs text-white/60">{c.patientAlias}</td>
                    {isAdminOrLab && <td className="p-4 text-white/60">{c.doctorName || "—"}</td>}
                    <td className="p-4 text-white/60">
                      {c.product.replace(/_/g, " ")}
                      {isWarranty && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">Warranty</span>}
                    </td>
                    <td className="p-4 text-center text-white/60">{c.units}</td>
                    <td className={`p-4 text-right font-mono ${isWarranty ? "text-white/30 decoration-line-through" : "text-emerald-400"}`}>
                      {formatCurrency(Number(c.cost))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ UNIFIED FOOTER: SAME ROW */}
      <div className="flex-none h-14 p-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
        <span className="text-xs text-white/40 pl-2">
          Showing {cases.length} of {totalCount} records
        </span>
        
        {cases.length < totalCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}