"use client";

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";

export default function ProgressTracker({
  stage,
  onClickStage,
}: {
  stage: Stage;
  onClickStage?: (s: Stage) => void;
}) {
  const order: Stage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING"];
  const idx = order.indexOf(stage);

  const label = (s: Stage) =>
    s === "DESIGN" ? "Design"
    : s === "MILLING_GLAZING" ? "Milling & Glazing"
    : "Shipping";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {order.map((s, i) => {
          const active = i <= idx;
          const common = "flex-1 h-2 rounded-full transition-colors";
          return (
            <button
              key={s}
              type="button"
              onClick={() => onClickStage?.(s)}
              title={label(s)}
              aria-label={label(s)}
              className={`${common} ${active ? "bg-white" : "bg-white/20"} ${
                onClickStage ? "cursor-pointer" : "cursor-default"
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-white/70">
        {order.map((s) => (
          <span key={s}>{label(s)}</span>
        ))}
      </div>
    </div>
  );
}
