// components/CaseProcessBar.tsx
"use client";

import { useState } from "react";
import type { Role, ProductionStage } from "@/lib/types";
import { StageProgress, STAGE_LABEL } from "./case-process/StageProgress";
import { ShippingModal } from "./case-process/ShippingModal";

export default function CaseProcessBar({
  caseId,
  stage,
  status,
  role,
  carrier,
  tracking,
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
  const [showShipModal, setShowShipModal] = useState(false);

  // Status Checks
  const isFullyDelivered = status === "DELIVERED";
  const isShippedOrDone = ["SHIPPED", "COMPLETED", "DELIVERED"].includes(status);
  
  // Permissions - 🔒 LOCKED TO ADMIN ONLY
  const isAdmin = role === "admin";
  const isDoctor = role === "customer";

  // --- LOGIC: Next Stage Calculation ---
  let nextStage: ProductionStage | null = null;
  let nextLabel = "";
  let canAdvance = false;
  let reason = "";

  if (stage === "DESIGN") {
    nextStage = "MILLING_GLAZING";
    nextLabel = "Start Milling";
    const isApproved = ["APPROVED", "IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED"].includes(status);
    
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
  } 
  else if (stage === "MILLING_GLAZING") {
    nextStage = "SHIPPING";
    nextLabel = "Ship Case";
    canAdvance = true; 
  } 
  else if (stage === "SHIPPING") {
    nextStage = "COMPLETED";
    nextLabel = "Mark Arrived";
    canAdvance = true; 
  } 
  else if (stage === "COMPLETED" && !isFullyDelivered) {
    nextStage = "DELIVERED";
    nextLabel = "Mark Delivered";
    canAdvance = true;
  }

  // --- VISIBILITY CHECK ---
  const showButton = 
    (isAdmin && nextStage !== null) || 
    (isDoctor && nextStage === "DELIVERED" && !isFullyDelivered);

  // --- HANDLERS ---
  const getTrackingLink = (num: string, cx?: string | null) => {
    if (!num) return "#";
    const c = (cx || "").toLowerCase();
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${num}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    return `https://www.google.com/search?q=${num}`;
  };

  async function handleAdvanceClick() {
    if (!nextStage || !canAdvance || busy) return;
    if (isDoctor && nextStage !== "DELIVERED") return;

    if (nextStage === "SHIPPING" && isAdmin) {
        setShowShipModal(true);
        return;
    }
    if (nextStage === "DELIVERED") { await submitStatusChange("DELIVERED"); return; }
    if (nextStage === "COMPLETED") { await submitStatusChange("COMPLETED"); return; }
    await submitStageChange(nextStage);
  }

  async function submitStatusChange(newStatus: string) {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch { setBusy(false); }
  }

  async function submitStageChange(newStage: ProductionStage) {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/stage`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch (e: any) { setErr(e?.message); setBusy(false); }
  }

  async function submitShipping(data: { carrier: string; tracking: string }) {
    setBusy(true); setErr(null);
    try {
        const res = await fetch(`/api/cases/${caseId}/shipping`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ carrier: data.carrier, tracking: data.tracking, eta: null })
        });
        if (!res.ok) throw new Error("Shipping update failed");
        window.location.reload();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="bg-surface border border-border rounded-3xl pt-6 px-6 pb-12 shadow-sm">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Manufacturing Process</h2>
          <p className="text-xs font-medium">
            Status: <span className={isFullyDelivered ? "text-green-500 font-bold tracking-wide" : "text-muted"}>
              {isFullyDelivered ? "DELIVERED TO PATIENT" : STAGE_LABEL[stage]}
            </span>
          </p>
        </div>

        {/* TRACKING BADGE */}
        {isShippedOrDone && tracking && (
          <div className="flex items-center gap-3 bg-[#9696e2]/10 border border-[#9696e2]/20 px-4 py-2 rounded-lg shadow-lg shadow-[#9696e2]/10 animate-in fade-in slide-in-from-right-2">
            <div className="p-2 bg-[#9696e2] rounded-full text-white">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <div>
               <div className="flex items-center gap-2">
                   <div className="text-[10px] text-[#9696e2] uppercase font-bold tracking-wider">{carrier || "Shipped"} Tracking</div>
                   {/* 🔒 Edit Tracking also locked to admin */}
                   {isAdmin && <button onClick={() => setShowShipModal(true)} className="text-muted hover:text-foreground"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
               </div>
               <a href={getTrackingLink(tracking, carrier)} target="_blank" rel="noopener noreferrer" className="text-sm font-mono font-medium text-foreground hover:text-accent flex items-center gap-1 group transition-colors">
                  {tracking}
                  <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
               </a>
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        {showButton && nextStage && (
          <div className="flex flex-col items-end">
             <button
              onClick={handleAdvanceClick}
              disabled={busy}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                ${canAdvance 
                  ? "bg-foreground text-background border-2 border-foreground hover:opacity-80 shadow-md" 
                  : "bg-surface text-muted border-2 border-border cursor-not-allowed"}
              `}
            >
              {busy ? "Updating..." : <>{nextLabel} →</>}
            </button>
            {!canAdvance && reason && <span className="text-[10px] text-orange-400 mt-1">{reason}</span>}
          </div>
        )}
      </div>

      {/* PROGRESS BAR */}
      <StageProgress currentStage={stage} isFullyDelivered={isFullyDelivered} />

      {/* MODAL */}
      <ShippingModal
        isOpen={showShipModal}
        busy={busy}
        initialCarrier={carrier || "UPS"}
        initialTracking={tracking || ""}
        onClose={() => setShowShipModal(false)}
        onSubmit={submitShipping}
      />
      
      {err && <p className="mt-2 text-xs text-center text-red-400">{err}</p>}
    </div>
  );
}