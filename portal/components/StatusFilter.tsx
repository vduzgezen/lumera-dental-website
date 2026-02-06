// portal/components/StatusFilter.tsx
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

// ✅ Added onChange prop
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

  // Sync internal state if parent prop changes (e.g. URL update)
  useEffect(() => {
    setSelection(new Set(selected));
  }, [selected]);

  const isDefault = selection.size === 0;

  const getDefaultSet = () => {
    if (role === "customer") {
        return new Set(ALL_STATUSES.filter(s => s !== "DELIVERED"));
    } else {
        return new Set(ALL_STATUSES.filter(s => s !== "COMPLETED" && s !== "DELIVERED"));
    }
  };

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
    // ✅ Notify Parent Immediately
    if (onChange) onChange(Array.from(next));
  };

  const reset = () => {
    const next = new Set<string>();
    setSelection(next);
    if (onChange) onChange([]);
  };

  const label = isDefault 
    ? "Status (Active)" 
    : `Status (${selection.size})`;

  const getStatusColor = (s: string) => {
    if (s === "CHANGES_REQUESTED") return "text-red-400";
    if (s === "APPROVED") return "text-lime-300";
    if (s === "IN_MILLING") return "text-yellow-400"; 
    if (s === "SHIPPED") return "text-blue-400";
    if (s === "COMPLETED") return "text-emerald-400";
    if (s === "DELIVERED") return "text-purple-400";
    return "text-orange-400"; 
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition-colors
          ${isOpen || !isDefault 
            ? "bg-white/10 border-white/30 text-white" 
            : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"}
        `}
      >
        <span>{label}</span>
        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-1">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors select-none"
                >
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                    ${isChecked ? "bg-blue-500 border-blue-500" : "border-white/30 bg-transparent"}
                  `}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${colorClass}`}>
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
              );
             })}
          </div>
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              type="button"
              onClick={reset}
              className="w-full text-left px-3 py-2 text-xs text-white/40 hover:text-white transition-colors"
            >
              Reset to Active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}