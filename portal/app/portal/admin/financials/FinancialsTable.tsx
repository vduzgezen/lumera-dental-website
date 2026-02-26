// portal/app/portal/admin/financials/FinancialsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CopyableId from "@/components/CopyableId";
import { formatProductName } from "@/lib/pricing";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const SortableHeader = ({ 
  label, colKey, sortConfig, onSort, className = "", align = "left"
}: any) => {
  const isActive = sortConfig.key === colKey;

  return (
    <th 
      className={`
        h-12 p-0 font-medium cursor-pointer transition-colors duration-200 select-none group border-b-2 outline-none whitespace-nowrap align-middle
        ${isActive ? "text-accent border-accent" : "text-muted border-transparent hover:text-foreground hover:bg-[var(--accent-dim)]"}
        ${className}
      `}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center h-full px-4 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>
        <span className="truncate">{label}</span>
        {isActive && (
          <span className="text-accent text-[10px] leading-none ml-1">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
};

export default function FinancialsTable({ rows, totalCount }: { rows: any[], totalCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [loadingMore, setLoadingMore] = useState(false);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return rows;
    const key = sortConfig.key;
    const direction = sortConfig.direction;

    return [...rows].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";
      switch (key) {
        case "alias": aVal = a.patientAlias; bVal = b.patientAlias; break;
        case "id": aVal = a.id; bVal = b.id; break;
        case "doctor": aVal = a.doctorName || ""; bVal = b.doctorName || ""; break;
        case "clinic": aVal = a.clinic.name; bVal = b.clinic.name; break;
        case "date": aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        case "designer": aVal = a.designerName || ""; bVal = b.designerName || ""; break;
        case "rep": aVal = a.salesRepName || ""; bVal = b.salesRepName || ""; break;
        case "product": aVal = a.product; bVal = b.product; break;
        case "units": aVal = a.units; bVal = b.units; break;
        case "revenue": aVal = Number(a.cost); bVal = Number(b.cost); break;
        case "haus": aVal = a.millingCost; bVal = b.millingCost; break;
        case "design": aVal = a.designCost; bVal = b.designCost; break;
        case "comm": aVal = a.commissionCost; bVal = b.commissionCost; break;
        case "margin": aVal = a.margin; bVal = b.margin; break;
      }
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

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
    <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl transition-colors">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm min-w-[1800px]">
          <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border h-12">
            <tr>
                <SortableHeader label="Case Alias" colKey="alias" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Case ID" colKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={handleSort} className="min-w-[140px]" />
                <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} className="w-[120px]" />
                <SortableHeader label="Date Created" colKey="date" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Designer" colKey="designer" sortConfig={sortConfig} onSort={handleSort} className="w-[110px]" />
                <SortableHeader label="Sales Rep" colKey="rep" sortConfig={sortConfig} onSort={handleSort} className="w-[120px]" />
                <SortableHeader label="Product" colKey="product" sortConfig={sortConfig} onSort={handleSort} className="min-w-[120px]" />
                <SortableHeader label="Units" colKey="units" sortConfig={sortConfig} onSort={handleSort} className="w-[50px]" align="center" />
                <SortableHeader label="Revenue" colKey="revenue" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-emerald-500" align="right" />
                <SortableHeader label="Haus Cost" colKey="haus" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-blue-500" align="right" />
                <SortableHeader label="Design Fee" colKey="design" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-purple-500" align="right" />
                <SortableHeader label="Comm." colKey="comm" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-orange-500" align="right" />
                <SortableHeader label="Margin" colKey="margin" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-foreground" align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.length === 0 && (
                <tr>
                    <td colSpan={14} className="p-12 text-center text-muted">No records found for this period.</td>
                </tr>
            )}
            {sortedRows.map(r => (
                <tr key={r.id} className="hover:bg-[var(--accent-dim)] transition-colors group h-12">
                    <td className="px-4 font-medium text-foreground truncate">{r.patientAlias}</td>
                    <td className="px-4"><CopyableId id={r.id} truncate /></td>
                    <td className="px-4 text-foreground/90 truncate">{r.doctorName || "—"}</td>
                    <td className="px-4 text-muted text-xs truncate">{r.clinic.name}</td>
                    <td className="px-4 text-muted text-xs font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 text-muted">
                        {r.designerName ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold flex items-center justify-center border border-purple-500/20 shrink-0">
                                    {r.designerName.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="text-xs truncate max-w-[120px] text-foreground" title={r.designerName}>{r.designerName}</span>
                            </div>
                        ) : <span className="text-muted/50 italic text-xs">-</span>}
                    </td>
                    <td className="px-4 text-foreground">
                        {r.salesRepName ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded border border-orange-500/20 truncate max-w-[100px]" title={r.salesRepName}>
                                    {r.salesRepName.split(' ')[0]}
                                </span>
                            </div>
                        ) : <span className="text-muted/50 italic text-xs">-</span>}
                    </td>
                    <td className="px-4 text-foreground">
                        <div className="text-xs font-medium truncate capitalize">{formatProductName(r.product, !!r.isBridge)}</div>
                        {r.material && <div className="text-[10px] text-muted truncate">{r.material}</div>}
                    </td>
                    <td className="px-4 text-center text-muted">{r.units}</td>
                    <td className="px-4 text-right font-medium text-emerald-500/90">{formatMoney(Number(r.cost))}</td>
                    <td className="px-4 text-right text-blue-500/90">{formatMoney(r.millingCost)}</td>
                    <td className="px-4 text-right text-purple-500/90">{formatMoney(r.designCost)}</td>
                    <td className="px-4 text-right text-orange-500/90">{formatMoney(r.commissionCost)}</td>
                    <td className="px-4 text-right font-bold text-foreground">{formatMoney(r.margin)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-none h-14 p-3 border-t border-border bg-surface flex items-center justify-between">
        <span className="text-xs text-muted pl-2">
          Showing {rows.length} of {totalCount} records
        </span>
        
        {rows.length < totalCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded-lg bg-surface hover:bg-[var(--accent-dim)] text-xs font-bold text-foreground transition-all flex items-center gap-2 border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                Loading...
              </>
            ) : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}