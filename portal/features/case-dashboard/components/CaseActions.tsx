// features/case-dashboard/components/CaseActions.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  role: Role;
  currentStatus: string;
  hasAllDesigns?: boolean;
  requiresStrictApproval?: boolean; 
};

export default function CaseActions({ 
    caseId, 
    role, 
    currentStatus, 
    hasAllDesigns = false,
    requiresStrictApproval = false
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function change(to: string) {
    setIsOpen(false);
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }), 
      });
      const j = await r.json().catch(() => ({}));
      
      if (r.ok) {
        window.location.reload();
      } else {
        throw new Error(j.error || "Action failed");
      }
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
      setTimeout(() => setErr(null), 5000);
    }
  }

  // Common Checks
  const isApproved = 
    currentStatus === "APPROVED" ||
    currentStatus === "IN_MILLING" ||
    currentStatus === "SHIPPED" ||
    currentStatus === "COMPLETED" ||
    currentStatus === "DELIVERED";

  if (isApproved) return null;

  const isDoctor = role === "customer";
  const isAdmin = role === "admin";
  const isLab = role === "lab";

  // --- BUILD AVAILABLE ACTIONS ---
  type ActionDef = { label: string; to: string; color: "red" | "emerald" | "blue"; disabled?: boolean; subtext?: string };
  const actions: ActionDef[] = [];

  const isDesigning = currentStatus === "IN_DESIGN" || currentStatus === "CHANGES_REQUESTED" || currentStatus === "READY_FOR_REVIEW";

  if (isDoctor && currentStatus === "READY_FOR_REVIEW") {
      actions.push({ label: "Request Changes", to: "CHANGES_REQUESTED", color: "red" });
      if (hasAllDesigns) {
          actions.push({ label: "Approve Design", to: "APPROVED", color: "emerald" });
      }
  }

  if ((isLab || isAdmin) && isDesigning) {
      actions.push({ label: "Request New Scan", to: "CHANGES_REQUESTED_FROM_DOCTOR", color: "red" });
      
      if (hasAllDesigns) {
          actions.push({ label: "Send to Doctor", to: "READY_FOR_REVIEW", color: "blue" });
          
          const strictBlocked = requiresStrictApproval && isLab;
          actions.push({ 
              label: "Approve & Mill", 
              to: "APPROVED", 
              color: "emerald", 
              disabled: strictBlocked,
              subtext: strictBlocked ? "Strict Approval Required" : undefined
          });
      }
  }

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={busy}
        className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-sm font-semibold hover:border-accent/50 hover:text-accent transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Updating..." : "Actions"}
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !busy && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1">
                  {actions.map((act, idx) => {
                      // Color mapping for the dropdown items
                      const colorClasses = act.disabled 
                        ? "text-muted opacity-50 cursor-not-allowed" 
                        : act.color === "red" ? "text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                        : act.color === "emerald" ? "text-emerald-500 hover:bg-emerald-500 hover:text-white cursor-pointer"
                        : "text-blue-500 hover:bg-blue-500 hover:text-white cursor-pointer";

                      return (
                          <button
                            key={idx}
                            disabled={act.disabled}
                            onClick={() => {
                                if (!act.disabled) change(act.to);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex flex-col ${colorClasses}`}
                          >
                              <span>{act.label}</span>
                              {act.subtext && <span className="text-[10px] font-medium opacity-80 mt-0.5">{act.subtext}</span>}
                          </button>
                      )
                  })}
              </div>
          </div>
      )}

      {/* ERROR MODAL */}
      {err && (
        <div className="fixed bottom-6 right-6 z-[9999] w-max max-w-[300px] bg-surface border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{err}</span>
          </div>
        </div>
      )}
    </div>
  );
}