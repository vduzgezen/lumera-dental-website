// portal/app/portal/admin/financials/FinancialsTable.tsx
"use client";

import { useState, useMemo } from "react";
import CopyableId from "@/components/CopyableId";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

// Reuse money formatter
function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const SortableHeader = ({ 
  label, 
  colKey, 
  sortConfig, 
  onSort,
  className = "",
  align = "left"
}: { 
  label: string, 
  colKey: string, 
  sortConfig: SortConfig, 
  onSort: (k: string) => void,
  className?: string,
  align?: "left" | "center" | "right"
}) => {
  const isActive = sortConfig.key === colKey;
  return (
    <th 
      className={`
        h-12 p-0 font-medium cursor-pointer transition-colors duration-200 select-none group border-b-2 outline-none whitespace-nowrap align-middle
        ${isActive 
          ? "text-white border-accent" 
          : "border-transparent hover:text-white"
        }
        ${className}
      `}
      onClick={() => onSort(colKey)}
    >
      {/* Container to center content vertically and apply padding/alignment */}
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

export default function FinancialsTable({ rows }: { rows: any[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return rows;

    return [...rows].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "alias": aVal = a.patientAlias; bVal = b.patientAlias; break;
        case "id": aVal = a.id; bVal = b.id; break;
        case "doctor": aVal = a.doctorName || ""; bVal = b.doctorName || ""; break;
        case "clinic": aVal = a.clinic.name; bVal = b.clinic.name; break;
        case "date": aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        case "designer": aVal = a.designerName || ""; bVal = b.designerName || ""; break;
        case "rep": aVal = a.salesRepName || ""; bVal = b.salesRepName || ""; break;
        case "product": aVal = a.product; bVal = b.product; break;
        case "units": aVal = a.units; bVal = b.units; break;
        
        // Numeric sorts
        case "revenue": aVal = Number(a.cost); bVal = Number(b.cost); break;
        case "haus": aVal = a.millingCost; bVal = b.millingCost; break;
        case "design": aVal = a.designCost; bVal = b.designCost; break;
        case "comm": aVal = a.commissionCost; bVal = b.commissionCost; break;
        case "margin": aVal = a.margin; bVal = b.margin; break;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
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

  return (
    <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Adjusted min-width slightly lower since columns are tighter */}
        <table className="w-full text-left text-sm min-w-[1800px]">
          <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10 h-12">
            <tr>
                <SortableHeader label="Case Alias" colKey="alias" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Case ID" colKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={handleSort} className="min-w-[140px]" />
                <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} className="w-[120px]" />
                <SortableHeader label="Date Created" colKey="date" sortConfig={sortConfig} onSort={handleSort} className="w-[100px]" />
                <SortableHeader label="Designer" colKey="designer" sortConfig={sortConfig} onSort={handleSort} className="w-[110px]" />
                <SortableHeader label="Sales Rep" colKey="rep" sortConfig={sortConfig} onSort={handleSort} className="w-[120px]" />
                <SortableHeader label="Product" colKey="product" sortConfig={sortConfig} onSort={handleSort} className="min-w-[120px]" />
                
                {/* ✅ Tighter Units Column */}
                <SortableHeader label="Units" colKey="units" sortConfig={sortConfig} onSort={handleSort} className="w-[50px]" align="center" />
                
                {/* ✅ Tighter Financial Columns */}
                <SortableHeader label="Revenue" colKey="revenue" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-emerald-400" align="right" />
                <SortableHeader label="Haus Cost" colKey="haus" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-blue-400" align="right" />
                <SortableHeader label="Design Fee" colKey="design" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-purple-400" align="right" />
                <SortableHeader label="Comm." colKey="comm" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px] text-orange-400" align="right" />
                <SortableHeader label="Margin" colKey="margin" sortConfig={sortConfig} onSort={handleSort} className="min-w-[60px]" align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedRows.length === 0 && (
                <tr>
                    <td colSpan={14} className="p-12 text-center text-white/40">No records found for this period.</td>
                </tr>
            )}
            {sortedRows.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors group h-12">
                    <td className="px-4 font-medium text-white truncate">{r.patientAlias}</td>
                    <td className="px-4"><CopyableId id={r.id} truncate /></td>
                    <td className="px-4 text-white/80 truncate">{r.doctorName || "—"}</td>
                    <td className="px-4 text-white/70 text-xs truncate">{r.clinic.name}</td>
                    <td className="px-4 text-white/60 text-xs font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 text-white/70">
                        {r.designerName ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center justify-center border border-purple-500/20 shrink-0">
                                    {r.designerName.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="text-xs truncate max-w-[120px]" title={r.designerName}>{r.designerName}</span>
                            </div>
                        ) : <span className="text-white/20 italic text-xs">-</span>}
                    </td>
                    <td className="px-4 text-white/70">
                        {r.salesRepName ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded border border-orange-500/20 truncate max-w-[100px]" title={r.salesRepName}>
                                    {r.salesRepName.split(' ')[0]}
                                </span>
                            </div>
                        ) : <span className="text-white/20 italic text-xs">-</span>}
                    </td>
                    <td className="px-4 text-white">
                        <div className="text-xs font-medium truncate">{r.product.replace(/_/g, " ")}</div>
                        {r.material && <div className="text-[10px] text-white/40 truncate">{r.material}</div>}
                    </td>
                    
                    {/* ✅ Tighter Body Cells to Match Header */}
                    <td className="px-4 text-center text-white/60">{r.units}</td>
                    <td className="px-4 text-right font-medium text-emerald-400/90">{formatMoney(Number(r.cost))}</td>
                    <td className="px-4 text-right text-blue-300/80">{formatMoney(r.millingCost)}</td>
                    <td className="px-4 text-right text-purple-300/80">{formatMoney(r.designCost)}</td>
                    <td className="px-4 text-right text-orange-300/80">{formatMoney(r.commissionCost)}</td>
                    <td className="px-4 text-right font-bold text-white/90">{formatMoney(r.margin)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}