// portal/components/CaseProcessBar.tsx
"use client";

import { useState } from "react";
import type { Role, ProductionStage } from "@/lib/types";
import { Truck, CheckCircle, ExternalLink } from "lucide-react"; // Import icons if available, or use SVG below

const STAGE_ORDER: ProductionStage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED"];
const STAGE_LABEL: Record<ProductionStage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling & Glazing",
  SHIPPING: "Delivering",
  COMPLETED: "Completed",
};

export default function CaseProcessBar({
  caseId,
  stage, 
  status,
  role,
  carrier,   // ✅ NEW
  tracking,  // ✅ NEW
}: {
  caseId: string;
  stage: ProductionStage;
  status: string;
  role: Role;
  carrier?: string | null;
  tracking?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const canEdit = role === "admin" || role === "lab";

  const isApproved = status === "APPROVED" || status === "IN_MILLING" || status === "SHIPPED";
  const isShippedOrDone = status === "SHIPPED" || status === "COMPLETED";

  // --- TRACKING LINK GENERATOR ---
  const getTrackingLink = (num: string, cx?: string | null) => {
    if (!num) return "#";
    const c = (cx || "").toLowerCase();
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${num}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    return `https://www.google.com/search?q=${num}`;
  };

  let nextStage: ProductionStage | null = null;
  let nextLabel = "";
  let canAdvance = false;
  let reason = "";

  if (stage === "DESIGN") {
    nextStage = "MILLING_GLAZING";
    nextLabel = "Start Milling";
    if (isApproved) {
      if (role === "lab") {
         canAdvance = false;
         reason = "Waiting for Milling Center pickup";
      } else {
         canAdvance = true;
      }
    } else {
      canAdvance = false;
      reason = "Requires Design Approval";
    }
  } else if (stage === "MILLING_GLAZING") {
    nextStage = "SHIPPING";
    nextLabel = "Ship Case";
    canAdvance = true; 
  } else if (stage === "SHIPPING") {
    nextStage = "COMPLETED";
    nextLabel = "Complete Case";
    canAdvance = true;
  }

  async function advance() {
    if (!nextStage || !canEdit || !canAdvance) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/stage`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message);
      setBusy(false);
    }
  }

  return (
    <div className="bg-black/20 border-b border-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white/90">Manufacturing Process</h2>
          <p className="text-xs text-white/50">Current: {STAGE_LABEL[stage]}</p>
        </div>

        {/* ✅ TRACKING DISPLAY (Visible to everyone when Shipped) */}
        {isShippedOrDone && tracking && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg shadow-lg shadow-blue-900/10 animate-in fade-in slide-in-from-right-2">
                <div className="p-2 bg-blue-500 rounded-full text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                </div>
                <div>
                    <div className="text-[10px] text-blue-300 uppercase font-bold tracking-wider mb-0.5">
                        {carrier || "Shipped"} Tracking
                    </div>
                    <a 
                        href={getTrackingLink(tracking, carrier)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-medium text-white hover:text-blue-300 flex items-center gap-1 group transition-colors"
                    >
                        {tracking}
                        <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        )}

        {/* ADMIN/LAB CONTROLS (Only if NOT Completed) */}
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

      <div className="relative flex items-center mx-2">
        <div className="absolute left-0 right-0 h-0.5 bg-white/10 top-3" />
        
        <ol className="relative z-10 flex w-full justify-between">
          {STAGE_ORDER.map((s, idx) => {
            const isDone = idx < currentIndex || stage === "COMPLETED";
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