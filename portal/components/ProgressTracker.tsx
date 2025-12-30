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
    <div className="rounded-xl border border-white/10 p-4">
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
                  ? "bg-white text-black border-white shadow-md scale-105"
                  : done
                  ? "bg-white/20 text-white border-white/20"
                  : "bg-white/5 text-white/40 border-white/5"}
                ${isClickable ? "cursor-pointer hover:bg-white/10" : "cursor-default"}
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