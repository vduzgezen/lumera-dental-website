// components/StatusFilter.tsx
"use client";

import { useState, useRef, useEffect } from "react";

const ALL_STATUSES = [
  "IN_DESIGN",
  "CHANGES_REQUESTED",
  "APPROVED",
  "IN_MILLING",
  "SHIPPED",
  "COMPLETED",
  "DELIVERED"
];

export default function StatusFilter({ 
  selected, 
  role, 
  onChange 
}: { 
  selected: string[], 
  role: string,
  onChange?: (statuses: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set(selected));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (selected.includes("NONE")) {
        setSelection(new Set());
    } else {
        setSelection(new Set(selected));
    }
  }, [selected]);

  const isDefault = selection.size === 0 && !selected.includes("NONE");
  
  const getDefaultSet = () => {
    if (role === "customer") {
        return new Set(ALL_STATUSES.filter(s => s !== "DELIVERED"));
    } else {
        return new Set(ALL_STATUSES.filter(s => s !== "COMPLETED" && s !== "DELIVERED"));
    }
  };
  
  const isAllSelected = selection.size === ALL_STATUSES.length;

  const toggle = (status: string) => {
    let next: Set<string>;
    if (isDefault) {
      next = getDefaultSet();
      if (next.has(status)) next.delete(status);
      else next.add(status);
    } else {
      next = new Set(selection);
      if (next.has(status)) next.delete(status);
      else next.add(status);
    }
    setSelection(next);
    if (onChange) onChange(Array.from(next));
  };

  const selectAll = () => {
    const next = new Set(ALL_STATUSES);
    setSelection(next);
    if (onChange) onChange(Array.from(next));
  };

  const deselectAll = () => {
    const next = new Set<string>();
    setSelection(next);
    if (onChange) onChange(["NONE"]);
  };

  const reset = () => {
    const next = new Set<string>();
    setSelection(next);
    if (onChange) onChange([]);
  };

  const label = isDefault 
    ? "Status (Active)" 
    : (selection.size === 0 ? "Status (None)" : `Status (${selection.size})`);

  const getStatusColor = (s: string) => {
    if (s === "CHANGES_REQUESTED") return "text-red-500";
    if (s === "APPROVED") return "text-lime-600 dark:text-lime-400";
    if (s === "IN_MILLING") return "text-yellow-600 dark:text-yellow-400"; 
    if (s === "SHIPPED") return "text-blue-600 dark:text-blue-400";
    if (s === "COMPLETED") return "text-emerald-600 dark:text-emerald-400";
    if (s === "DELIVERED") return "text-purple-600 dark:text-purple-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition-colors
          ${isOpen || !isDefault 
            ? "bg-[var(--accent-dim)] border-accent text-accent font-medium" 
            : "bg-surface border-border text-muted hover:border-accent/50 hover:text-foreground"}
        `}
      >
        <span>{label}</span>
        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          
          {/* Header with Select/Deselect All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-highlight">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Filter Status</span>
            <div className="flex items-center gap-1">
              {isAllSelected ? (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-accent hover:text-foreground font-medium px-2 py-1 rounded hover:bg-[var(--accent-dim)] transition-colors"
                >
                  Deselect All
                </button>
              ) : (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-accent hover:text-foreground font-medium px-2 py-1 rounded hover:bg-[var(--accent-dim)] transition-colors"
                >
                  Select All
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
             {ALL_STATUSES.map((status) => {
              const defaultSet = getDefaultSet();
              const isChecked = isDefault 
                ? defaultSet.has(status)
                : selection.has(status);
              
              const colorClass = getStatusColor(status);
              
              return (
                <div 
                  key={status} 
                  onClick={() => toggle(status)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--accent-dim)] cursor-pointer transition-colors select-none"
                >
                  {/* CHECKBOX CONTAINER */}
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                    ${isChecked ? "bg-accent border-accent" : "border-border bg-surface"}
                  `}>
                    {isChecked && (
                      // ✅ THE FIX: Use var(--foreground) to force Black in Light / White in Dark
                      <svg 
                        className="w-3 h-3 text-[var(--foreground)]" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${colorClass}`}>
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
              );
             })}
          </div>
          
          <div className="border-t border-border mt-1 pt-1 bg-surface-highlight">
            <button
              type="button"
              onClick={reset}
              className="w-full text-left px-3 py-2 text-xs text-muted hover:text-foreground transition-colors"
            >
              Reset to Active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}