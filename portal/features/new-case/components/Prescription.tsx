// portal/features/new-case/components/Prescription.tsx
"use client";

import { CaseData, ProductType } from "./types";

interface Props {
  data: CaseData;
  onChange: (updates: Partial<CaseData>) => void;
}

const PRODUCTS = ["ZIRCONIA", "MULTILAYER_ZIRCONIA", "EMAX", "INLAY_ONLAY", "NIGHTGUARD"];

export default function Prescription({ data, onChange }: Props) {
  // Check if shade is required based on product
  const isShadeRequired = data.product !== "NIGHTGUARD";

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-lg">
      <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">
        Prescription
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* ROW 1: Product & Material */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Product</label>
          <select
            value={data.product}
            onChange={(e) => onChange({ product: e.target.value as ProductType })}
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition-colors duration-200 appearance-none"
          >
            {PRODUCTS.map(p => (
              <option key={p} value={p} className="bg-gray-900">
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Material (Optional)</label>
          <input
            value={data.material || ""}
            onChange={(e) => onChange({ material: e.target.value as any })}
            placeholder="e.g. Zirconia"
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
      </div>

      {/* ROW 2: Shades */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* BODY SHADE (Mandatory for most) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">
            Body Shade {isShadeRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            value={data.shade}
            onChange={(e) => onChange({ shade: e.target.value })}
            placeholder={isShadeRequired ? "Required (e.g. A2)" : "Optional"}
            className={`w-full rounded-lg bg-surface-highlight border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200 ${isShadeRequired && !data.shade ? "border-red-500/50" : "border-border"}`}
          />
        </div>

        {/* GINGIVAL SHADE (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Gingival Shade <span className="text-[10px] opacity-70">(Optional)</span></label>
          <input
            value={data.shadeGingival || ""}
            onChange={(e) => onChange({ shadeGingival: e.target.value })}
            placeholder="e.g. Pink"
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>

        {/* INCISAL SHADE (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Incisal Shade <span className="text-[10px] opacity-70">(Optional)</span></label>
          <input
            value={data.shadeIncisal || ""}
            onChange={(e) => onChange({ shadeIncisal: e.target.value })}
            placeholder="e.g. Translucent"
            className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition-colors duration-200"
          />
        </div>
      </div>
       
      {/* ROW 3: Doctor Preferences */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted">Doctor Preferences</label>
            <span className="text-[10px] text-muted">Auto-filled from doctor profile</span>
        </div>
        <textarea
          value={data.doctorPreferences || ""}
          onChange={(e) => onChange({ doctorPreferences: e.target.value })}
          className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none h-24 resize-none transition-colors duration-200"
        />
      </div>
    </div>
  );
}