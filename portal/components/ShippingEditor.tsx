"use client";
import { useState } from "react";

type Role = "customer" | "lab" | "admin";

export default function ShippingEditor({
  caseId,
  role,
  carrier,
  tracking,
  eta, // ISO string or null
}: {
  caseId: string;
  role: Role;
  carrier?: string | null;
  tracking?: string | null;
  eta?: string | null;
}) {
  const canEdit = role === "lab" || role === "admin";
  const [form, setForm] = useState({
    carrier: carrier ?? "",
    tracking: tracking ?? "",
    // datetime-local wants "YYYY-MM-DDTHH:MM"
    eta: eta ? new Date(eta).toISOString().slice(0, 16) : "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  if (!canEdit) return null;

  async function save() {
    setBusy(true);
    setErr(undefined);
    const body: any = {
      carrier: form.carrier,
      tracking: form.tracking,
      eta: form.eta ? new Date(form.eta).toISOString() : null,
    };
    const r = await fetch(`/api/cases/${caseId}/shipping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (r.ok) {
      if (typeof window !== "undefined") window.location.reload();
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Save failed");
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          className="rounded-lg p-2 bg-surface-highlight border border-border text-foreground transition-colors duration-200"
          placeholder="Carrier"
          value={form.carrier}
          onChange={(e) => setForm({ ...form, carrier: e.target.value })}
        />
        <input
          className="rounded-lg p-2 bg-surface-highlight border border-border text-foreground transition-colors duration-200"
          placeholder="Tracking #"
          value={form.tracking}
          onChange={(e) => setForm({ ...form, tracking: e.target.value })}
        />
        <input
          type="datetime-local"
          className="rounded-lg p-2 bg-surface-highlight border border-border text-foreground transition-colors duration-200"
          value={form.eta}
          onChange={(e) => setForm({ ...form, eta: e.target.value })}
        />
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <button
        onClick={save}
        disabled={busy}
        className="rounded-lg px-3 py-2 bg-accent text-white disabled:opacity-60 hover:bg-accent/80 transition-colors duration-200"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
