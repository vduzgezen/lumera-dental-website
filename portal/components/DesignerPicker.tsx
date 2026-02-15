// components/DesignerPicker.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  caseId: string;
  currentAssigneeId: string | null;
  designers: UserOption[];
  disabled?: boolean;
};

export default function DesignerPicker({ caseId, currentAssigneeId, designers, disabled }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVal = e.target.value;
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newVal || null }),
      });
      if (!res.ok) throw new Error("Failed");
      
      router.refresh();
    } catch {
      // ✅ Removed unused 'err'
      alert("Failed to update assignment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-center gap-3 bg-surface-highlight rounded-lg px-3 py-2 border border-border transition-colors duration-200 ${disabled ? "opacity-50" : "hover:border-accent/50"}`}>
      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <div className="flex-1">
        <select
          value={currentAssigneeId || ""}
          onChange={handleChange}
          disabled={busy || disabled}
          className={`w-full bg-transparent border-none text-sm text-foreground focus:ring-0 p-0 transition-colors duration-200 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <option value="" className="bg-surface text-muted">-- Unassigned --</option>
          {designers.map(d => (
            <option key={d.id} value={d.id} className="bg-surface text-foreground">
              {d.name || d.email}
            </option>
          ))}
        </select>
      </div>
      {busy && <span className="text-[10px] text-accent animate-pulse">...</span>}
    </div>
  );
}