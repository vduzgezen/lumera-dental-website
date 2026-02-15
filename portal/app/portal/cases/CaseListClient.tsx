// app/portal/cases/CaseListClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import CaseListRow from "@/components/CaseListRow";
import { CaseRow } from "./page";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

interface Props {
  cases: CaseRow[];
  role: string;
  totalCount: number;
}

const SortableHeader = ({ 
  label, 
  colKey, 
  sortConfig, 
  onSort 
}: { 
  label: string, 
  colKey: string, 
  sortConfig: SortConfig, 
  onSort: (k: string) => void 
}) => {
  const isActive = sortConfig.key === colKey;
  return (
    <th 
      className={`
        p-4 font-medium cursor-pointer transition-colors duration-200 select-none group border-b outline-none whitespace-nowrap
        ${isActive 
          ? "text-accent border-accent" 
          : "border-transparent text-muted hover:text-foreground"
        }
      `}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center gap-1 ${colKey === "status" ? "justify-center" : ""}`}>
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

export default function CaseListClient({ cases, role, totalCount }: Props) {
  const router = useRouter();
  const isDoctor = role === "customer";
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [loadingMore, setLoadingMore] = useState(false);

  const sortedCases = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return cases;
    
    return [...cases].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";
      switch (sortConfig.key) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "alias": aVal = a.patientAlias; bVal = b.patientAlias; break;
        case "clinic": aVal = a.clinic.name; bVal = b.clinic.name; break;
        case "doctor": aVal = a.doctorName || ""; bVal = b.doctorName || ""; break;
        case "patient": aVal = a.patientLastName || ""; bVal = b.patientLastName || ""; break;
        case "designer": aVal = a.assigneeUser?.name || ""; bVal = b.assigneeUser?.name || ""; break;
        case "tooth": aVal = a.toothCodes; bVal = b.toothCodes; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "due": aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0; bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0; break;
        case "created": aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
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
    const params = new URLSearchParams(window.location.search);
    const currentLimit = parseInt(params.get("limit") || "50");
    const newLimit = currentLimit + 50;
    params.set("limit", newLimit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
    setTimeout(() => setLoadingMore(false), 1500);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
          <thead className="bg-surface/90 sticky top-0 backdrop-blur-md z-10 border-b border-border">
            <tr>
              <SortableHeader label="Case ID" colKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Alias" colKey="alias" sortConfig={sortConfig} onSort={handleSort} />
              {isDoctor ? (
                <>
                    <SortableHeader label="Patient Name" colKey="patient" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} />
                </>
              ) : (
                <>
                    <SortableHeader label="Doctor" colKey="doctor" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Clinic" colKey="clinic" sortConfig={sortConfig} onSort={handleSort} />
                </>
              )}
              {!isDoctor && (
                <SortableHeader label="Designer" colKey="designer" sortConfig={sortConfig} onSort={handleSort} />
              )}
              <SortableHeader label="Tooth" colKey="tooth" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Status" colKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Due Date" colKey="due" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Created" colKey="created" sortConfig={sortConfig} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedCases.map((c) => (
              <CaseListRow key={c.id} data={c} role={role} />
            ))}
            {sortedCases.length === 0 && (
               <tr><td className="p-12 text-center text-muted" colSpan={isDoctor ? 8 : 9}>No cases found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex-none h-14 p-2 border-t border-border bg-surface/50 flex items-center justify-between">
          <span className="text-xs text-muted pl-2">
            Showing {cases.length} of {totalCount} cases
          </span>

          {cases.length < totalCount && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-1.5 rounded-lg border border-border bg-surface hover:bg-[var(--accent-dim)] text-xs font-bold text-foreground transition-colors flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <span className="w-3 h-3 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                  Loading...
                </>
              ) : "Load More"}
            </button>
          )}
      </div>
    </div>
  );
}
