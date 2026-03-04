// portal/components/new-case/CaseInfo.tsx
"use client";

import { CaseData } from "./types";
import {
  RESTORATION_OPTIONS,
  getMaterialOptions,
  getDefaultMaterial,
  RETENTION_OPTIONS,
  synthesizeProductKey,
  RestorationType,
  RetentionType,
} from "./types";

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

// ✅ HELPER: Strict Manual Check for YYYY-MM-DD
function isDateIncorrect(dateStr: string) {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return true;

  const y = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const d = parseInt(parts[2]);

  // Check 1: Year must be 4 digits (e.g. 1000-9999)
  if (y < 1000 || y > 9999) return true;
  // Check 2: Month 1-12
  if (m < 1 || m > 12) return true;
  // Check 3: Day 1-31
  if (d < 1 || d > 31) return true;

  return false;
}

export default function CaseInfo({ data, update }: CaseInfoProps) {
  
  const handleOrderDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOrderDate = e.target.value;
    update({ orderDate: newOrderDate });

    // Auto-suggest due date only if the date looks valid enough
    if (!isDateIncorrect(newOrderDate)) {
       const newDueDate = addDays(newOrderDate, 8); 
       update({ dueDate: newDueDate });
    }
  };

  // Handle restoration type change - cascade to material
  const handleRestorationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRestorationType = e.target.value as RestorationType;
    const defaultMaterial = getDefaultMaterial(newRestorationType);
    
    // Reset retention type if not implant
    const newRetentionType = newRestorationType === "IMPLANT" ? data.retentionType : undefined;
    
    // Synthesize the composite product key
    const newProduct = synthesizeProductKey(newRestorationType, defaultMaterial, newRetentionType);
    
    update({
      restorationType: newRestorationType,
      material: defaultMaterial as CaseData["material"],
      retentionType: newRetentionType,
      product: newProduct,
    });
  };

  // Handle material change
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMaterial = e.target.value;
    const newProduct = synthesizeProductKey(data.restorationType, newMaterial, data.retentionType);
    
    update({
      material: newMaterial as CaseData["material"],
      product: newProduct,
    });
  };

  // Handle retention type change (implants only)
  const handleRetentionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRetention = e.target.value as RetentionType;
    const newProduct = synthesizeProductKey(data.restorationType, data.material, newRetention);
    
    update({
      retentionType: newRetention,
      product: newProduct,
    });
  };

  // Get available materials for current restoration type
  const materialOptions = getMaterialOptions(data.restorationType);

  // 1. Check Format (Day > 31, Month > 12, Year != 4 digits)
  const orderFormatInvalid = isDateIncorrect(data.orderDate);
  const dueFormatInvalid = isDateIncorrect(data.dueDate);

  // 2. Check Timing (Due < Order)
  const timingInvalid = data.orderDate && data.dueDate && data.dueDate < data.orderDate;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-lg transition-colors duration-200">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h2 className="text-lg font-medium text-foreground">Case Information</h2>
        {/* Live Alias Preview */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-muted tracking-wider">Auto-ID:</span>
          <span className="font-mono text-sm font-bold text-[#9696e2] bg-[#9696e2]/20 px-2 py-1 rounded border border-[#9696e2]/30 dark:border-[#9696e2]/50">
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
            onChange={handleOrderDateChange}
            className={`w-full rounded-lg bg-surface-highlight border px-4 py-3 text-foreground placeholder:text-muted outline-none transition-colors duration-200 ${orderFormatInvalid ? 'border-red-500/50' : 'border-border focus:border-accent/50'}`}
          />
          {orderFormatInvalid && (
            <p className="text-xs text-red-400 font-medium animate-pulse">
                Date is incorrect.
            </p>
          )}
        </div>
      
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Due Date</label>
          <input
            type="date"
            required
            value={data.dueDate} 
            onChange={(e) => update({ dueDate: e.target.value })} 
            className={`w-full rounded-lg bg-surface-highlight border px-4 py-3 text-foreground placeholder:text-muted outline-none transition-colors duration-200 ${dueFormatInvalid || timingInvalid ? 'border-red-500/50' : 'border-border focus:border-accent/50'}`}
          />
          {(dueFormatInvalid || timingInvalid) && (
            <p className="text-xs text-red-400 font-medium animate-pulse">
                Date is incorrect.
            </p>
          )}
        </div>
      </div>

      {/* PRODUCT MATRIX: Cascading Dropdowns */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Product Selection</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Restoration Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Restoration Type</label>
            <select
              value={data.restorationType}
              onChange={handleRestorationTypeChange}
              // ✅ Added cursor-pointer and hover effect
              className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition-colors duration-200 cursor-pointer hover:bg-[var(--accent-dim)]"
            >
              {RESTORATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Material (Cascades based on Restoration Type) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Material</label>
            <select
              value={data.material}
              onChange={handleMaterialChange}
              disabled={data.restorationType === "INLAY_ONLAY"}
              // ✅ Added cursor logic and appearance-none for the locked state
              className={`w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition-colors duration-200 ${
                data.restorationType === "INLAY_ONLAY" 
                  ? "opacity-60 cursor-not-allowed appearance-none" 
                  : "cursor-pointer hover:bg-[var(--accent-dim)]"
              }`}
            >
              {materialOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Retention Type - Only for Implants */}
        {data.restorationType === "IMPLANT" && (
          <div className="space-y-2 md:max-w-xs">
            <label className="text-sm font-medium text-muted">Retention Type</label>
            <select
              value={data.retentionType || ""}
              onChange={handleRetentionChange}
              // ✅ Added cursor-pointer and hover effect here too for consistency
              className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition-colors duration-200 cursor-pointer hover:bg-[var(--accent-dim)]"
            >
              <option value="">Select retention type...</option>
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              This information will be included in the design preferences for the lab.
            </p>
          </div>
        )}

        {/* Display synthesized product key */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-[10px] uppercase text-muted tracking-wider">Product Code:</span>
          <span className="font-mono text-xs text-foreground bg-surface-highlight px-2 py-1 rounded border border-border">
            {data.product}
          </span>
        </div>
      </div>
    </div>
  );
}
