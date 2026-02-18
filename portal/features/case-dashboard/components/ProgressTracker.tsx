// portal/components/ProgressTracker.tsx
"use client";

// Export this type so others can reuse it if needed
export type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";

const STAGES: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING"];

export default function ProgressTracker({
  stage,
  onClickStage,
}: {
  stage: Stage;
  onClickStage?: (stage: Stage) => void;
}) {
  const activeIdx = STAGES.indexOf(stage);

  return (
    <div className="rounded-xl border border-border p-4 bg-surface">
      <div className="flex items-center justify-between gap-2">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const isClickable = !!onClickStage;

          return (
            <button
              key={s}
              type="button"
              onClick={() => isClickable && onClickStage(s)}
              disabled={!isClickable}
              className={`
                flex-1 py-2 rounded-lg text-xs font-medium border transition-all
                ${active
                  ? "bg-accent text-white border-accent shadow-md scale-105"
                  : done
                  ? "bg-accent/20 text-foreground border-accent/30"
                  : "bg-surface text-muted border-border"}
                ${isClickable ? "cursor-pointer hover:bg-[var(--accent-dim)]" : "cursor-default"}
              `}
            >
              {s.replace("_", " ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}