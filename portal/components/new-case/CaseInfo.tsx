// portal/components/new-case/CaseInfo.tsx
"use client";

import { useMemo } from "react";
import { NewCaseState } from "./types";

interface Props {
  data: NewCaseState;
  onChange: (updates: Partial<NewCaseState>) => void;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function CaseInfo({ data, onChange }: Props) {
  const dueDateDisplay = useMemo(() => {
    const d = new Date(data.orderDate);
    if (isNaN(d.getTime())) return "";
    return addDays(d, 8).toISOString().split("T")[0];
  }, [data.orderDate]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-6 shadow-lg">
      <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
        Case Information
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Patient Alias / ID</label>
          <input
            required
            value={data.patientAlias}
            onChange={(e) => onChange({ patientAlias: e.target.value })}
            placeholder="e.g. JD-0425"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Date of Order</label>
          <input
            type="date"
            required
            value={data.orderDate}
            onChange={(e) => onChange({ orderDate: e.target.value })}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition [color-scheme:dark]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Due Date (Auto +8 Days)</label>
          <input
            readOnly
            disabled
            value={dueDateDisplay}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/50 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}