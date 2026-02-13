// portal/components/CaseProcessBar.tsx
"use client";

import { useState } from "react";
import type { Role, ProductionStage } from "@/lib/types";

// ✅ 5 Stages
const STAGE_ORDER: ProductionStage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"];

const STAGE_LABEL: Record<ProductionStage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling",
  SHIPPING: "Shipping",
  COMPLETED: "Arrived", // "Completed" = Arrived at Clinic
  DELIVERED: "Delivered", // "Delivered" = To Patient
};

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
  const [shipForm, setShipForm] = useState({
    carrier: carrier || "UPS",
    tracking: tracking || "",
    otherCarrier: ""
  });

  const currentIndex = STAGE_ORDER.indexOf(stage);
  
  // Permissions
  const canEdit = role === "admin" || role === "lab" || role === "milling";
  const isDoctor = role === "customer";

  const isShippedOrDone = ["SHIPPED", "COMPLETED", "DELIVERED"].includes(status);

  // --- LOGIC ---
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
  else if (stage === "COMPLETED") {
    nextStage = "DELIVERED";
    nextLabel = "Mark Delivered";
    // Doctors CAN do this step
    canAdvance = true;
  }

  // --- VISIBILITY CHECK ---
  // STRICT RULE: Doctors only see button if next stage is DELIVERED
  const showButton = 
    (canEdit) || 
    (isDoctor && nextStage === "DELIVERED");

  // --- HANDLERS ---
  async function handleAdvanceClick() {
    if (!nextStage || !canAdvance) return;

    // Safety: Prevent doctors from triggering non-delivery actions even if they tried
    if (isDoctor && nextStage !== "DELIVERED") return;

    if (nextStage === "SHIPPING" && canEdit) {
        setShipForm({
            carrier: carrier || "UPS",
            tracking: tracking || "",
            otherCarrier: ""
        });
        setShowShipModal(true);
        return;
    }

    if (nextStage === "DELIVERED") {
        await submitStatusChange("DELIVERED");
        return;
    }

    if (nextStage === "COMPLETED") {
        await submitStatusChange("COMPLETED");
        return;
    }

    await submitStageChange(nextStage);
  }

  async function submitStatusChange(newStatus: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  async function submitStageChange(newStage: ProductionStage) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/stage`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message);
      setBusy(false);
    }
  }

  async function submitShipping() {
    const finalCarrier = shipForm.carrier === "Other" ? shipForm.otherCarrier : shipForm.carrier;
    if (!finalCarrier) return setErr("Carrier required");
    if (!shipForm.tracking) return setErr("Tracking number required");

    setBusy(true);
    try {
        const res = await fetch(`/api/cases/${caseId}/shipping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                carrier: finalCarrier,
                tracking: shipForm.tracking,
                eta: null 
            })
        });
        if (!res.ok) throw new Error("Shipping update failed");
        window.location.reload();
    } catch (e: any) {
        setErr(e.message);
        setBusy(false);
    }
  }

  return (
    <div className="bg-surface border-b border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Manufacturing Process</h2>
          <p className="text-xs text-muted">Current: {STAGE_LABEL[stage]}</p>
        </div>

        {/* TRACKING */}
        {isShippedOrDone && tracking && (
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg shadow-lg shadow-blue-900/10 animate-in fade-in slide-in-from-right-2">
                <div className="p-2 bg-blue-500 rounded-full text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">
                            {carrier || "Shipped"} Tracking
                        </div>
                        {canEdit && (
                            <button onClick={() => setShowShipModal(true)} className="text-muted hover:text-foreground transition" title="Edit Tracking">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                    </div>
                    <a href={getTrackingLink(tracking, carrier)} target="_blank" rel="noopener noreferrer" className="text-sm font-mono font-medium text-foreground hover:text-accent flex items-center gap-1 group transition-colors">
                        {tracking}
                        <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </div>
        )}

        {/* CONTROLS */}
        {showButton && nextStage && (
          <div className="flex flex-col items-end">
             <button
              onClick={handleAdvanceClick}
              disabled={busy} // Removed !canAdvance here because we filter via showButton logic
              className={`
                px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
                ${canAdvance 
                  ? "bg-accent hover:bg-accent/80 text-white shadow-lg" 
                  : "bg-surface text-muted cursor-not-allowed border border-border"}
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

      {/* PROGRESS CIRCLES */}
      <div className="relative flex items-center mx-2">
        <div className="absolute left-0 right-0 h-0.5 bg-border top-3" />
        <ol className="relative z-10 flex w-full justify-between">
           {STAGE_ORDER.map((s, idx) => {
            const isDone = idx < currentIndex || status === "DELIVERED";
            const isCurrent = idx === currentIndex && status !== "DELIVERED";
            const check = isDone || (s === "DELIVERED" && status === "DELIVERED");

            return (
              <li key={s} className="flex flex-col items-center gap-2">
                <div 
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors
                    ${check 
                      ? "bg-accent border-accent text-white" 
                      : isCurrent 
                        ? "bg-surface border-accent text-accent" 
                        : "bg-surface border-border text-muted"}
                  `}
                >
                  {check ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] font-medium tracking-wide uppercase ${isCurrent ? "text-accent" : "text-muted"}`}>
                  {STAGE_LABEL[s]}
                </span>
              </li>
            );
           })}
        </ol>
      </div>

      {/* MODAL */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-lg font-semibold text-foreground">Shipment Details</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1">Carrier</label>
                        <select className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent" value={shipForm.carrier} onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })}>
                            <option value="UPS">UPS</option><option value="FedEx">FedEx</option><option value="USPS">USPS</option><option value="DHL">DHL</option><option value="Other">Other</option>
                        </select>
                    </div>
                    {shipForm.carrier === "Other" && (
                        <input placeholder="Enter Carrier Name" className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent" value={shipForm.otherCarrier} onChange={(e) => setShipForm({ ...shipForm, otherCarrier: e.target.value })} />
                    )}
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1">Tracking Number</label>
                        <input placeholder="1Z999..." className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent" value={shipForm.tracking} onChange={(e) => setShipForm({ ...shipForm, tracking: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowShipModal(false)} className="px-4 py-2 text-muted hover:text-foreground transition" disabled={busy}>Cancel</button>
                    <button onClick={submitShipping} disabled={busy || !shipForm.tracking} className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition disabled:opacity-50">{busy ? "Saving..." : "Confirm & Ship"}</button>
                </div>
            </div>
        </div>
      )}
      {err && <p className="mt-2 text-xs text-center text-red-400">{err}</p>}
    </div>
  );
}