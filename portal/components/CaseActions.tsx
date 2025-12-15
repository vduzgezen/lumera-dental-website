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

  const canCustomer = new Set(["APPROVED", "CHANGES_REQUESTED"]);
  const showApprove = role !== "customer" || canCustomer.has("APPROVED");
  const showRequest = role !== "customer" || canCustomer.has("CHANGES_REQUESTED");

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a short note (optional)"
        className="w-full h-20 rounded-lg p-2 bg-black/40 border border-white/10 text-white"
      />
      <div className="flex gap-2">
        {showApprove && (
          <button onClick={() => change("APPROVED")} className="rounded-lg px-3 py-2 bg-white text-black">
            Approve
          </button>
        )}
        {showRequest && (
          <button onClick={() => change("CHANGES_REQUESTED")} className="rounded-lg px-3 py-2 border border-white/20">
            Request changes
          </button>
        )}
      </div>
      <p className="text-xs text-white/50">Current: {currentStatus}</p>
    </div>
  );
}
