// portal/components/StatusFilter.tsx
"use client";

import { useState, useRef, useEffect } from "react";

const ALL_STATUSES = [
  "IN_DESIGN",
  "CHANGES_REQUESTED",
  "APPROVED",
  "IN_MILLING",
  "SHIPPED",
  "COMPLETED"
];

export default function StatusFilter({ selected }: { selected: string[] }) {
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

  // Helper: Is the filter in "Default Mode" (Active Only)?
  const isDefault = selection.size === 0;

  const toggle = (status: string) => {
    let next: Set<string>;

    if (isDefault) {
      // Transition from Default (Implicitly all active) to Custom
      // 1. Start with all ACTIVE statuses (everything except COMPLETED)
      next = new Set(ALL_STATUSES.filter(s => s !== "COMPLETED"));
      
      // 2. Apply the toggle
      if (next.has(status)) next.delete(status); // Uncheck if already checked
      else next.add(status); // Check if not checked (e.g. COMPLETED)
    } else {
      // Standard toggle
      next = new Set(selection);
      if (next.has(status)) next.delete(status);
      else next.add(status);
    }
    
    setSelection(next);
  };

  const label = isDefault 
    ? "Status (Current)" 
    : `Status (${selection.size})`;

  const getStatusColor = (s: string) => {
    if (s === "CHANGES_REQUESTED") return "text-red-400";
    if (s === "APPROVED") return "text-lime-300";
    if (s === "IN_MILLING") return "text-purple-400";
    if (s === "SHIPPED") return "text-blue-400";
    if (s === "COMPLETED") return "text-emerald-400";
    return "text-orange-400"; // IN_DESIGN
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

      {/* FORM SUBMISSION LOGIC:
        - If isDefault (Active Only), submit NO status inputs. Server defaults to { not: "COMPLETED" }.
        - If !isDefault (Custom), submit the specific statuses.
      */}
      {!isDefault && Array.from(selection).map(s => (
        <input key={s} type="hidden" name="status" value={s} />
      ))}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-1">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {ALL_STATUSES.map((status) => {
              // VISUAL LOGIC:
              // If Default: Check everything except COMPLETED.
              // If Custom: Check what's in the set.
              const isChecked = isDefault 
                ? status !== "COMPLETED" 
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
                    ${isChecked 
                      ? "bg-blue-500 border-blue-500" 
                      : "border-white/30 bg-transparent"}
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
              onClick={() => setSelection(new Set())}
              className="w-full text-left px-3 py-2 text-xs text-white/40 hover:text-white transition-colors"
            >
              Reset to Current
            </button>
          </div>
        </div>
      )}
    </div>
  );
}