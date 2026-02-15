// portal/components/new-case/CaseInfo.tsx
"use client";

import { CaseData } from "./types";

interface CaseInfoProps {
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function CaseInfo({ data, update }: CaseInfoProps) {
  
  // Handle Order Date Change -> Auto-update Due Date
  const handleOrderDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOrderDate = e.target.value;
    const newDueDate = addDays(newOrderDate, 8); // Default buffer
    
    update({ 
      orderDate: newOrderDate,
      dueDate: newDueDate // Auto-set due date
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-lg transition-colors duration-200">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h2 className="text-lg font-medium text-foreground">Case Information</h2>
        {/* Live Alias Preview */}
        <div className="flex items-center gap-2">
           <span className="text-[10px] uppercase text-muted tracking-wider">Auto-ID:</span>
           <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
             {data.patientAlias || "Waiting for data..."}
           </span>
        </div>
      </div>
      
      {/* Name Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Patient First Name</label>
          <input
            required
            value={data.patientFirstName}
            onChange={(e) => update({ patientFirstName: e.target.value })}
            placeholder="e.g. John"
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Patient Last Name</label>
          <input
            required
            value={data.patientLastName}
            onChange={(e) => update({ patientLastName: e.target.value })}
            placeholder="e.g. Doe"
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Date of Order</label>
          <input
            type="date"
            required
            value={data.orderDate}
            onChange={handleOrderDateChange} // ✅ Updates both dates
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Due Date</label>
          <input
            type="date"
            required
            value={data.dueDate} // ✅ Bound to editable state
            onChange={(e) => update({ dueDate: e.target.value })} // ✅ Allow manual edit
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
      </div>
    </div>
  );
}