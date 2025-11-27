// components/ProgressTracker.tsx
"use client";

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";
type Role = "customer" | "lab" | "admin";

const STAGES: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING"];

export default function ProgressTracker({
  caseId,
  stage,
  role,
}: {
  caseId: string;
  stage: Stage;
  role: Role;
}) {
  const activeIdx = STAGES.indexOf(stage);
  const canAdvance = role === "lab" || role === "admin";

  async function goTo(idx: number) {
    if (!canAdvance) return;
    const target = STAGES[idx];
    // Map stage click → a status we store for auditing
    const to =
      target === "DESIGN"
        ? "IN_DESIGN"
        : target === "MILLING_GLAZING"
        ? "IN_MILLING"
        : "SHIPPED";

    await fetch(`/api/cases/${caseId}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to }),
    });
    location.reload();
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <button
              key={s}
              type="button"
              onClick={() => goTo(i)}
              className={[
                "flex-1 mx-1 py-2 rounded-lg text-sm border",
                active
                  ? "bg-white text-black border-white"
                  : done
                  ? "bg-white/20 text-white border-white/20"
                  : "bg-white/10 text-white/70 border-white/10",
                canAdvance ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              disabled={!canAdvance}
              title={canAdvance ? `Set stage to ${s}` : undefined}
            >
              {s.replace("_", " ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
