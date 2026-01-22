// components/CaseProcessBar.tsx
"use client";

import { useState } from "react";
import type { Role, ProductionStage } from "@/lib/types";

// FIX: Added COMPLETED to visualization order
const STAGE_ORDER: ProductionStage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED"];

const STAGE_LABEL: Record<ProductionStage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling & Glazing",
  SHIPPING: "Delivering",
  COMPLETED: "Completed",
};

export default function CaseProcessBar({
  caseId,
  stage, // Use prop directly (no need for local state if we reload)
  status,
  role,
}: {
  caseId: string;
  stage: ProductionStage;
  status: string;
  role: Role;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const canEdit = role === "admin" || role === "lab";

  // GUARD RAILS
  const isApproved = status === "APPROVED" || status === "IN_MILLING" || status === "SHIPPED";
  
  // Logic for the "Advance" button
  let nextStage: ProductionStage | null = null;
  let nextLabel = "";
  let canAdvance = false;
  let reason = "";

  if (stage === "DESIGN") {
    nextStage = "MILLING_GLAZING";
    nextLabel = "Start Milling";
    if (isApproved) {
      canAdvance = true;
    } else {
      canAdvance = false;
      reason = "Requires Design Approval";
    }
  } else if (stage === "MILLING_GLAZING") {
    nextStage = "SHIPPING";
    nextLabel = "Ship Case";
    canAdvance = true; 
  } else if (stage === "SHIPPING") {
    // FIX: Added logic to finish the case
    nextStage = "COMPLETED";
    nextLabel = "Complete Case";
    canAdvance = true;
  }

  async function advance() {
    if (!nextStage || !canEdit || !canAdvance) return;
    setBusy(true);
    setErr(null);
    try {
      // FIX: Changed PATCH to POST to match your API route definition
      const res = await fetch(`/api/cases/${caseId}/stage`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      
      // Reload to reflect new status/stage sync
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message);
      setBusy(false);
    }
  }

  return (
    <div className="bg-black/20 border-b border-white/10 p-4">
      {/* Top Row: Title + Advance Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white/90">Manufacturing Process</h2>
          <p className="text-xs text-white/50">Current: {STAGE_LABEL[stage]}</p>
        </div>

        {/* Advance Button (Lab Only) */}
        {canEdit && nextStage && (
          <div className="flex flex-col items-end">
            <button
              onClick={advance}
              disabled={!canAdvance || busy}
              className={`
                px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
                ${canAdvance 
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20" 
                  : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"}
              `}
            >
              {busy ? "Updating..." : (
                <>
                  {nextLabel} →
                </>
              )}
            </button>
            {!canAdvance && reason && (
              <span className="text-[10px] text-orange-400 mt-1">{reason}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress Circles */}
      <div className="relative flex items-center mx-2">
        <div className="absolute left-0 right-0 h-0.5 bg-white/10 top-3" />
        
        <ol className="relative z-10 flex w-full justify-between">
          {STAGE_ORDER.map((s, idx) => {
            const isDone = idx < currentIndex || stage === "COMPLETED"; // Ensure completed marks all as done
            const isCurrent = idx === currentIndex;
            
            return (
              <li key={s} className="flex flex-col items-center gap-2">
                <div 
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors
                    ${isDone 
                      ? "bg-blue-500 border-blue-500 text-white" 
                      : isCurrent 
                        ? "bg-black border-blue-500 text-blue-400" 
                        : "bg-black border-white/20 text-white/30"}
                  `}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <span 
                  className={`
                    text-[10px] font-medium tracking-wide uppercase
                    ${isCurrent ? "text-blue-300" : "text-white/40"}
                  `}
                >
                  {STAGE_LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {err && <p className="mt-2 text-xs text-center text-red-400">{err}</p>}
    </div>
  );
}