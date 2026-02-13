// portal/app/portal/cases/milling/MillingTable.tsx
"use client";

import { CaseRow } from "../page";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

interface Props {
  cases: CaseRow[];
  selectedIds: Set<string>;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  // ✅ Pagination Props
  totalCount: number;
  onLoadMore: () => void;
  loadingMore: boolean;
}

const fmtDate = (d?: Date | string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
};

const SortableHeader = ({ 
  label, 
  colKey, 
  align = "left",
  sortConfig, 
  onSort 
}: { 
  label: string, 
  colKey: string, 
  align?: string,
  sortConfig: SortConfig, 
  onSort: (k: string) => void 
}) => {
  const isActive = sortConfig.key === colKey;
  return (
    <th 
      className={`
        p-4 font-medium cursor-pointer transition-all select-none text-${align} group border-b-2 outline-none
        ${isActive 
          ? "text-accent border-accent" 
          : "text-muted border-transparent hover:text-foreground hover:bg-[var(--accent-dim)]"
        }
      `}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center ${align === "right" ? "justify-end" : ""}`}>
        {label}
        {isActive && (
          <span className="text-accent ml-2 text-xs">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
};

export default function MillingTable({ 
  cases, 
  selectedIds, 
  sortConfig, 
  onSort, 
  onSelect, 
  onSelectAll,
  totalCount,
  onLoadMore,
  loadingMore
}: Props) {
  const allSelected = cases.length > 0 && selectedIds.size === cases.length;

  return (
    // ✅ FIX: Rounded corners & Overflow handling
    <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-surface sticky top-0 backdrop-blur-md z-10 border-b border-border">
            <tr>
              <th className="p-4 w-10 border-b-2 border-transparent">
                <input
                  type="checkbox"
                  onChange={onSelectAll}
                  checked={allSelected}
                  className="accent-blue-500"
                />
              </th>
              <SortableHeader label="Case ID" colKey="id" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Alias" colKey="alias" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Zip Code" colKey="zip" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Product Details" colKey="product" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Status" colKey="status" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Date Approved" colKey="approved" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Due Date" colKey="due" sortConfig={sortConfig} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cases.map((c) => (
              <tr
                key={c.id}
                className={`hover:bg-[var(--accent-dim)] transition-colors ${selectedIds.has(c.id) ? "bg-[var(--accent-dim)]" : ""}`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => onSelect(c.id)}
                    className="accent-blue-500"
                  />
                </td>
                <td className="p-4 font-mono text-blue-400 select-all">#{c.id.slice(-6)}</td>
                <td className="p-4 font-medium text-foreground">{c.patientAlias}</td>
                <td className="p-4 font-medium text-foreground">
                  {c.doctorUser?.name || c.doctorName || <span className="text-muted italic">Unknown</span>}
                </td>
                <td className="p-4 text-muted font-mono">
                  {c.doctorUser?.address?.zipCode || <span className="text-muted">-</span>}
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">{c.product}</span>
                    <span className="text-xs text-muted">
                      {c.material ? `${c.material} • ` : ""}
                      {c.serviceLevel?.replace(/_/g, " ") || "Standard"}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold tracking-wide border
                       ${
                         c.status === "APPROVED"
                           ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                           : c.status === "IN_MILLING"
                           ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                           : c.status === "SHIPPED"
                           ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                           : "bg-white/5 text-white/50 border-white/10"
                       }`}
                  >
                    {c.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4 text-muted">{fmtDate(c.updatedAt)}</td>
                <td className="p-4 text-muted">{fmtDate(c.dueDate)}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-muted">
                  No cases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ UNIFIED FOOTER: Fixed Height h-14 to avoid shrinkage */}
      <div className="flex-none h-14 p-3 border-t border-border bg-surface flex items-center justify-between">
        <span className="text-xs text-muted pl-2">
          Showing {cases.length} of {totalCount} records (Milling Queue)
        </span>
        
        {cases.length < totalCount && (
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold text-foreground hover:text-accent px-3 py-1.5 rounded-lg bg-surface hover:bg-[var(--accent-dim)] border border-border transition-colors flex items-center gap-2"
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