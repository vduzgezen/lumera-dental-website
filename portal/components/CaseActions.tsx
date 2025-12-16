// portal/components/CaseActions.tsx
"use client";
import { useState } from "react";

type Props = {
  caseId: string;
  role: "customer" | "lab" | "admin";
  currentStatus: string;
};

export default function CaseActions({ caseId, role, currentStatus }: Props) {
  const [note, setNote] = useState("");

  async function change(to: string) {
    const r = await fetch(`/api/cases/${caseId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, note }),
    });
    if (r.ok) window.location.reload();
    else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Action failed");
    }
  }

  // Guard Rail: Can't approve if already approved
  const isApproved = currentStatus === "APPROVED" || currentStatus === "IN_MILLING" || currentStatus === "SHIPPED";
  
  const canCustomer = new Set(["APPROVED", "CHANGES_REQUESTED"]);
  
  // Logic: Show Approve only if NOT yet approved AND (Role is Lab/Admin OR Status allows Customer)
  const showApprove = !isApproved && (role !== "customer" || canCustomer.has("APPROVED"));
  
  const showRequest = role !== "customer" || canCustomer.has("CHANGES_REQUESTED");

  return (
    <div className="space-y-3">
      {/* If Approved, show a static badge instead of the button */}
      {isApproved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium">
          ✓ Case Approved
        </div>
      )}

      {/* Input area only if actions are available */}
      {(showApprove || showRequest) && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a short note (optional)"
          className="w-full h-20 rounded-lg p-2 bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-sm focus:border-white/30 outline-none"
        />
      )}

      <div className="flex gap-2">
        {showApprove && (
          <button 
            onClick={() => change("APPROVED")} 
            className="flex-1 rounded-lg px-3 py-2 bg-white text-black font-medium hover:bg-gray-200 transition"
          >
            Approve Design
          </button>
        )}
        {showRequest && (
          <button 
            onClick={() => change("CHANGES_REQUESTED")} 
            className="flex-1 rounded-lg px-3 py-2 border border-white/20 hover:bg-white/5 transition text-white"
          >
            Request Changes
          </button>
        )}
      </div>
      
      {!isApproved && (
        <p className="text-xs text-white/40 text-center">
          Current: {currentStatus.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}