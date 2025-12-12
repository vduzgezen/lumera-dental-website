// components/CaseProcessBar.tsx
"use client";

import { useState } from "react";

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";
type Role = "admin" | "lab" | "customer";

const STAGE_ORDER: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING"];

const STAGE_LABEL: Record<Stage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling & Glazing",
  SHIPPING: "Delivering",
};

const STAGE_HELP: Record<Stage, string> = {
  DESIGN: "Case is in design (scans, adjustments, approvals).",
  MILLING_GLAZING: "Case is being milled and glazed.",
  SHIPPING: "Case is packaged and being delivered.",
};

export default function CaseProcessBar({
  caseId,
  stage: initialStage,
  role,
}: {
  caseId: string;
  stage: Stage;
  role: Role;
}) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const canEdit = role === "admin" || role === "lab";

  async function changeStage(next: Stage) {
    if (!canEdit) return;
    const nextIndex = STAGE_ORDER.indexOf(next);
    if (nextIndex <= currentIndex) return; // only forward

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update stage");
      }
      setStage(next);
    } catch (e: any) {
      setErr(e?.message || "Failed to update stage");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white/90">
            Manufacturing Process
          </h2>
          <p className="text-xs text-white/60">
            {STAGE_HELP[stage]}
          </p>
        </div>
        {busy && (
          <span className="text-xs text-white/60">Updating…</span>
        )}
      </div>

      <div className="relative flex items-center">
        {/* Line */}
        <div className="absolute left-4 right-4 h-px bg-white/10 top-1/2 -translate-y-1/2" />

        {/* Steps */}
        <ol className="relative z-10 flex w-full justify-between">
          {STAGE_ORDER.map((s, idx) => {
            const isActive = idx === currentIndex;
            const isDone = idx < currentIndex;
            const clickable =
              canEdit && idx > currentIndex && !busy;

            return (
              <li key={s} className="flex flex-col items-center w-1/3">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && changeStage(s)}
                  className={[
                    "w-7 h-7 rounded-full border flex items-center justify-center text-xs",
                    isDone
                      ? "bg-emerald-400 border-emerald-300 text-black"
                      : isActive
                      ? "bg-white text-black border-white"
                      : "bg-black border-white/30 text-white/60",
                    clickable ? "hover:scale-105 transition-transform" : "",
                  ].join(" ")}
                >
                  {isDone ? "✓" : idx + 1}
                </button>
                <span className="mt-1 text-[11px] text-center text-white/70">
                  {STAGE_LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {err && (
        <p className="mt-2 text-xs text-red-400">
          {err}
        </p>
      )}

      {!canEdit && (
        <p className="mt-1 text-[11px] text-white/50">
          This timeline is managed by the lab.
        </p>
      )}
    </div>
  );
}
