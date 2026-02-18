// portal/components/StageControls.tsx
"use client";

import { useState } from "react";
import ProgressTracker from "./ProgressTracker";

type Stage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING";
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
    const r = await fetch(`/api/cases/${caseId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: s }),
    });
    if (r.ok) {
      setCurrent(s);
      // refresh server data so timestamps update
      if (typeof window !== "undefined") window.location.reload();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Failed to update stage");
    }
  }

  return (
    <div>
      <ProgressTracker
        stage={current}
        onClickStage={canEdit ? setStage : undefined}
      />
      {!canEdit && (
        <p className="mt-2 text-xs text-muted">
          The lab updates these stages as your case progresses.
        </p>
      )}
    </div>
  );
}