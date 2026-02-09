// portal/components/new-case/Prescription.tsx
"use client";

// ✅ FIX: Import 'CaseData' and 'ProductType' instead of 'NewCaseState'
import { CaseData, ProductType } from "./types";

interface Props {
  data: CaseData;
  onChange: (updates: Partial<CaseData>) => void;
}

const PRODUCTS = ["ZIRCONIA", "MULTILAYER_ZIRCONIA", "EMAX", "INLAY_ONLAY"];

export default function Prescription({ data, onChange }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-6 shadow-lg">
      <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
        Prescription
      </h2>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Product</label>
          <select
            value={data.product}
            // ✅ FIX: Cast to ProductType
            onChange={(e) => onChange({ product: e.target.value as ProductType })}
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition appearance-none"
          >
            {PRODUCTS.map(p => (
              <option key={p} value={p} className="bg-gray-900">
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Shade (e.g. A2)</label>
          <input
            value={data.shade}
            onChange={(e) => onChange({ shade: e.target.value })}
            placeholder="A2"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Material (Optional)</label>
          <input
            value={data.material || ""}
            onChange={(e) => onChange({ material: e.target.value as any })}
            placeholder="e.g. Zirconia"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-white/70">Designer Preferences</label>
            <span className="text-[10px] text-white/40">Auto-filled from doctor profile</span>
        </div>
        <textarea
          value={data.designPreferences || ""}
          onChange={(e) => onChange({ designPreferences: e.target.value })}
          placeholder="E.g. Contacts heavy, light occlusion, open embrasures..."
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition h-24 resize-none"
        />
      </div>
    </div>
  );
}