// components/ActionsBar.tsx
"use client";

import { useState } from "react";

type Role = "customer" | "lab" | "admin";
type Status =
  | "NEW"
  | "IN_DESIGN"
  | "READY_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "IN_MILLING"
  | "SHIPPED";

export default function ActionsBar({
  caseId,
  role,
  status,
}: {
  caseId: string;
  role: Role;
  status: Status;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canDoctor = role === "customer";
  const canLab = role === "lab" || role === "admin";

  async function send(to: Status) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, note: note || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed");
      setMsg("Saved.");
      setNote("");
      location.reload();
    } catch (e: any) {
      setErr(e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4 bg-surface">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note…"
          className="px-3 py-1.5 rounded-md bg-surface-highlight border border-border text-sm flex-1 min-w-[200px] text-foreground placeholder:text-muted"
        />

        {/* Doctor actions */}
        {canDoctor && (
          <>
            <button
              disabled={busy}
              onClick={() => send("APPROVED")}
              className="px-3 py-1.5 rounded-md bg-emerald-400 text-black text-sm"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => send("CHANGES_REQUESTED")}
              className="px-3 py-1.5 rounded-md bg-amber-300 text-black text-sm"
            >
              Request Changes
            </button>
          </>
        )}

        {/* Lab can mark ready for review, or move back to design */}
        {canLab && (
          <>
            <button
              disabled={busy}
              onClick={() => send("READY_FOR_REVIEW")}
              className="px-3 py-1.5 rounded-md bg-accent text-white text-sm hover:bg-accent/80 transition"
            >
              Ready for Review
            </button>
            <button
              disabled={busy}
              onClick={() => send("IN_DESIGN")}
              className="px-3 py-1.5 rounded-md bg-surface-highlight text-foreground text-sm border border-border hover:bg-[var(--accent-dim)] transition"
            >
              Back to Design
            </button>
          </>
        )}
      </div>

      {msg && <p className="text-emerald-400 text-sm mt-2">{msg}</p>}
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}

      <p className="text-muted text-xs mt-2">
        Status now: <b>{status}</b>
      </p>
    </div>
  );
}
