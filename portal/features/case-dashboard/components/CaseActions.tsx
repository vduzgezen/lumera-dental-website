// features/case-dashboard/components/CaseActions.tsx
"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  role: Role;
  currentStatus: string;
  hasAllDesigns?: boolean;
};

export default function CaseActions({ caseId, role, currentStatus, hasAllDesigns = false }: Props) {
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
      setTimeout(() => setErr(null), 5000);
    }
  }

  const isApproved = 
    currentStatus === "APPROVED" ||
    currentStatus === "IN_MILLING" ||
    currentStatus === "SHIPPED" ||
    currentStatus === "COMPLETED";
  
  const canCustomer = new Set(["APPROVED", "CHANGES_REQUESTED"]);
  
  const showApprove = !isApproved && (role !== "customer" || (canCustomer.has("APPROVED") && hasAllDesigns));
  const showRequest = !isApproved && (role !== "customer" || (canCustomer.has("CHANGES_REQUESTED") && hasAllDesigns));

  if (isApproved) return null;

  return (
    <div className="relative flex items-center gap-3">
      {/* ✅ Fully opaque red button */}
      {showRequest && (
        <button 
          onClick={() => change("CHANGES_REQUESTED")} 
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-red-700 bg-red-500 text-white hover:bg-red-700 transition-all text-xs font-bold disabled:opacity-50 shadow-sm"
        >
          Request Changes
        </button>
      )}
      
      {/* ✅ Fully opaque emerald button */}
      {showApprove && (
        <button 
          onClick={() => change("APPROVED")} 
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold disabled:opacity-50 shadow-sm"
        >
          {busy ? "Updating..." : "Approve Design"}
        </button>
      )}

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