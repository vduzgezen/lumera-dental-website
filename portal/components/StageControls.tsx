// portal/components/StageControls.tsx
"use client";

import { useState } from "react";
import ProgressTracker, { Stage } from "@/components/ProgressTracker";

type Role = "customer" | "lab" | "admin";

export default function StageControls({
  caseId,
  stage,
  role,
}: {
  caseId: string;
  stage: Stage;
  role: Role;
}) {
  const [current, setCurrent] = useState<Stage>(stage);
  const canEdit = role === "lab" || role === "admin";

  async function setStage(s: Stage) {
    if (!canEdit) return;
    if (s === current) return;
    
    const previous = current;
    setCurrent(s);

    try {
      const r = await fetch(`/api/cases/${caseId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: s }),
      });

      if (r.ok) {
        if (typeof window !== "undefined") window.location.reload();
      } else {
        throw new Error("Failed");
      }
    } catch {
      // Removed unused 'e' variable
      setCurrent(previous);
      alert("Failed to update stage");
    }
  }

  return (
    <div className="w-full">
      <ProgressTracker
        stage={current}
        onClickStage={canEdit ? setStage : undefined}
      />
      {!canEdit && (
        <p className="mt-3 text-center text-xs text-muted/60">
          Tracking status updated by laboratory.
        </p>
      )}
    </div>
  );
}