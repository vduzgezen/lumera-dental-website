// portal/components/CaseActions.tsx
"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  role: Role;
  currentStatus: string;
};

export default function CaseActions({ caseId, role, currentStatus }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function change(to: string) {
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
      // Auto-clear error after 5 seconds
      setTimeout(() => setErr(null), 5000);
    }
  }

  const isApproved = 
    currentStatus === "APPROVED" ||
    currentStatus === "IN_MILLING" || 
    currentStatus === "SHIPPED" ||
    currentStatus === "COMPLETED";
  
  const canCustomer = new Set(["APPROVED", "CHANGES_REQUESTED"]);
  
  const showApprove = !isApproved && (role !== "customer" || canCustomer.has("APPROVED"));
  const showRequest = !isApproved && (role !== "customer" || canCustomer.has("CHANGES_REQUESTED"));

  if (isApproved) return null; 

  return (
    // FIX: 'relative' establishes the anchor for the absolute error message
    <div className="relative flex items-center gap-2">
      {showRequest && (
        <button 
          onClick={() => change("CHANGES_REQUESTED")} 
          disabled={busy}
          className="px-3 py-1.5 rounded-md border border-border hover:bg-[var(--accent-dim)] transition text-foreground text-xs font-medium disabled:opacity-50"
        >
          Request Changes
        </button>
      )}
      
      {showApprove && (
        <button 
          onClick={() => change("APPROVED")} 
          disabled={busy}
          className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-bold hover:bg-accent/80 transition shadow-lg disabled:opacity-50"
        >
          {busy ? "Updating..." : "Approve Design"}
        </button>
      )}

      {/* FIX: 'absolute' takes it out of flow so it doesn't stretch the header */}
      {err && (
        <div className="absolute top-full right-0 mt-3 z-50 w-max max-w-[250px] bg-surface border border-red-500/30 text-red-200 text-xs px-3 py-2 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{err}</span>
          </div>
          {/* Little arrow pointing up */}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-surface border-t border-l border-red-500/30 rotate-45" />
        </div>
      )}
    </div>
  );
}