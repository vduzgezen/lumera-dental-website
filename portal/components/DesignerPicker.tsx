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
  disabled?: boolean; // NEW PROP
};

export default function DesignerPicker({ caseId, currentAssigneeId, designers, disabled }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVal = e.target.value; // "" or ID
    setBusy(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newVal || null }),
      });
      if (!res.ok) throw new Error("Failed");
      
      router.refresh();
    } catch (err) {
      alert("Failed to update assignment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${disabled ? "opacity-50" : ""}`}>
      <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <div className="flex-1">
        <select
          value={currentAssigneeId || ""}
          onChange={handleChange}
          disabled={busy || disabled}
          className={`w-full bg-transparent border-none text-sm text-white/80 focus:ring-0 p-0 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:text-white"
          }`}
        >
          <option value="" className="bg-midnight text-white/50">-- Unassigned --</option>
          {designers.map(d => (
            <option key={d.id} value={d.id} className="bg-midnight text-white">
              {d.name || d.email}
            </option>
          ))}
        </select>
      </div>
      {busy && <span className="text-[10px] text-white/40 animate-pulse">...</span>}
    </div>
  );
}