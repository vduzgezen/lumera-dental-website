"use client";

import { useState } from "react";

type Role = "customer" | "lab" | "admin";

export default function ReviewToggle({
  caseId,
  role,
  needsReview,
  reviewQuestion,
}: {
  caseId: string;
  role: Role;
  needsReview: boolean;
  reviewQuestion?: string | null;
}) {
  const canEdit = role === "lab" || role === "admin";
  const [busy, setBusy] = useState(false);

  if (!canEdit) return null;

  async function request() {
    const q = prompt("What should the doctor review? (short)");
    if (q == null) return;
    setBusy(true);
    const r = await fetch(`/api/cases/${caseId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsReview: true, question: q }),
    });
    setBusy(false);
    if (r.ok) location.reload();
    else alert((await r.json()).error || "Failed");
  }

  async function clearReview() {
    if (!confirm("Clear doctor review?")) return;
    setBusy(true);
    const r = await fetch(`/api/cases/${caseId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsReview: false }),
    });
    setBusy(false);
    if (r.ok) location.reload();
    else alert((await r.json()).error || "Failed");
  }

  return (
    <div className="space-y-2">
      {needsReview ? (
        <>
          <p className="text-amber-300 text-sm">
            Review requested{reviewQuestion ? `: ${reviewQuestion}` : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={request}
              disabled={busy}
              className="rounded-lg px-3 py-2 border border-white/20"
            >
              Update question
            </button>
            <button
              onClick={clearReview}
              disabled={busy}
              className="rounded-lg px-3 py-2 bg-white text-black"
            >
              Clear review
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={request}
          disabled={busy}
          className="rounded-lg px-3 py-2 border border-white/20"
        >
          Request Doctor Review
        </button>
      )}
    </div>
  );
}
