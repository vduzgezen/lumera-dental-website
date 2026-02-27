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
  files = [],
}: {
  caseId: string;
  stage: ProductionStage;
  status: string;
  role: Role;
  carrier?: string | null;
  tracking?: string | null;
  files?: any[];
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [waiveFee, setWaiveFee] = useState(false);

  // Status Checks
  const isFullyDelivered = status === "DELIVERED";
  const isShippedOrDone = ["SHIPPED", "COMPLETED", "DELIVERED"].includes(status);
  const isCancelled = status === "CANCELLED";

  // Permissions
  const isAdmin = role === "admin";
  const isDoctor = role === "customer";
  const isAdminOrLab = role === "admin" || role === "lab";

  // --- LOGIC: Cancel Warnings ---
  const hasDesignFiles = files.some(f => String(f.label).startsWith("design_stl_") || String(f.label) === "design_only");
  const isProduced = ["MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"].includes(stage) || ["IN_MILLING", "SHIPPED", "COMPLETED", "DELIVERED"].includes(status);

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

  async function handleCancelCase() {
    setBusy(true);
    await submitStatusChange("CANCELLED", waiveFee);
  }

  async function submitStatusChange(newStatus: string, waive: boolean = false) {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: newStatus, waiveFee: waive }),
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
    <div className="bg-surface border border-border rounded-3xl pt-6 px-6 pb-12 shadow-sm relative">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Manufacturing Process</h2>
          <p className="text-xs font-medium">
            Status: <span className={isFullyDelivered ? "text-green-500 font-bold tracking-wide" : isCancelled ? "text-red-500 font-bold tracking-wide" : "text-muted"}>
               {isFullyDelivered ? "DELIVERED TO PATIENT" : isCancelled ? "CANCELLED" : STAGE_LABEL[stage]}
            </span>
          </p>
        </div>

        {/* TRACKING BADGE */}
        {isShippedOrDone && tracking && !isCancelled && (
          <div className="flex items-center gap-3 bg-[#9696e2]/10 border border-[#9696e2]/20 px-4 py-2 rounded-lg shadow-lg shadow-[#9696e2]/10 animate-in fade-in slide-in-from-right-2">
            <div className="p-2 bg-[#9696e2] rounded-full text-white">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <div>
               <div className="flex items-center gap-2">
                   <div className="text-[10px] text-[#9696e2] uppercase font-bold tracking-wider">{carrier || "Shipped"} Tracking</div>
                   {isAdmin && <button onClick={() => setShowShipModal(true)} className="text-muted hover:text-foreground"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
               </div>
               <a href={getTrackingLink(tracking, carrier)} target="_blank" rel="noopener noreferrer" className="text-sm font-mono font-medium text-foreground hover:text-accent flex items-center gap-1 group transition-colors">
                   {tracking}
                  <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
               </a>
            </div>
          </div>
         )}

        {/* ACTION BUTTONS */}
        {!isCancelled && (
          <div className="flex items-start gap-3"> 
            
            {/* 🛑 CANCEL CASE BUTTON */}
            {!isFullyDelivered && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white hover:scale-105 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Cancel Case
              </button>
            )}

            {/* NEXT STAGE ADVANCE BUTTON */}
            {showButton && nextStage && (
              <div className="flex flex-col items-end">
                <button
                  onClick={handleAdvanceClick}
                  disabled={busy}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    ${canAdvance 
                      ? "bg-foreground text-background border border-foreground hover:brightness-110 hover:scale-105" 
                      : "bg-surface text-muted border border-border shadow-none"}
                  `}
                >
                  {busy ? "Updating..." : <>{nextLabel} →</>}
                </button>
                {!canAdvance && reason && <span className="text-[10px] text-orange-400 mt-1">{reason}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROGRESS BAR */}
      <StageProgress currentStage={stage} isFullyDelivered={isFullyDelivered} />

      {/* SHIPPING MODAL */}
      <ShippingModal
        isOpen={showShipModal}
        busy={busy}
        initialCarrier={carrier || "UPS"}
        initialTracking={tracking || ""}
        onClose={() => setShowShipModal(false)}
        onSubmit={submitShipping}
      />

      {/* ⚠️ CANCEL WARNING MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-4">Cancel Case</h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-foreground/80">
                Are you sure you want to cancel this case? This action cannot be undone.
              </p>

              {/* 👨‍⚕️ DOCTOR VIEW: Standard Warnings */}
              {!isAdminOrLab && (
                <>
                  {isProduced ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                        This case is already in production. If you cancel now, you will be charged a production cancellation fee.
                      </p>
                    </div>
                  ) : hasDesignFiles ? (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex gap-3">
                      <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium leading-relaxed">
                        This case has already been designed. If you cancel now, you will be charged a design cancellation fee.
                      </p>
                    </div>
                   ) : null}
                </>
              )}

              {/* 🛠️ ADMIN/LAB VIEW: Detailed Breakdown & Waive Option */}
              {isAdminOrLab && (
                 <div className={`p-4 rounded-xl border transition-colors ${waiveFee ? "bg-emerald-500/10 border-emerald-500/20" : "bg-surface-highlight border-border"}`}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                            <span className="text-xs font-bold text-foreground block mb-1">Administrative Cancellation</span>
                            <span className="text-[10px] text-muted leading-tight block max-w-[200px]">
                                {isProduced 
                                    ? "Case is in production. Cancelling will apply a penalty fee matching Vendor Costs."
                                    : hasDesignFiles 
                                        ? "Case is designed. Cancelling will apply a penalty fee matching Design Costs."
                                        : "Case has no work completed. No penalty fee will be applied."}
                            </span>
                        </div>
                        
                        {/* Dynamic Fee Pill */}
                        <div className={`px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap ${waiveFee ? "text-emerald-500 line-through" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                            {isProduced ? "Production Fee" : hasDesignFiles ? "Design Fee" : "No Fee"}
                        </div>
                    </div>

                    {/* Waive Checkbox */}
                    {(isProduced || hasDesignFiles) && (
                        <label className="flex items-center gap-2 mt-4 pt-3 border-t border-border cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={waiveFee}
                                onChange={(e) => setWaiveFee(e.target.checked)}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-foreground group-hover:text-emerald-400 transition-colors">
                                Waive cancellation fee for this customer
                            </span>
                        </label>
                    )}
                 </div>
              )}
             </div>

            <div className="flex justify-end gap-3">
              {/* ✅ Standardized Keep Case Button */}
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-surface border border-border text-foreground text-sm font-semibold hover:brightness-110 hover:scale-105 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
               >
                Keep Case
              </button>
              
              {/* ✅ Standardized Confirm Cancellation Button */}
              <button
                onClick={handleCancelCase}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white hover:scale-105 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {busy && <div className="w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin" />}
                Confirm Cancellation
              </button>
             </div>
          </div>
        </div>
      )}
      
      {err && <p className="mt-2 text-xs text-center text-red-400">{err}</p>}
    </div>
  );
}