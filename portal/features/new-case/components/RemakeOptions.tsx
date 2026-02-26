// features/new-case/components/RemakeOptions.tsx
"use client";

import { CaseData } from "./types";

interface Props {
  data: CaseData;
  onChange: (updates: Partial<CaseData>) => void;
}

// ✅ DYNAMIC INSURANCE PRICING HELPER
export function getInsurancePrice(product: string): number {
  const p = (product || "").toUpperCase();
  if (p.includes("IMPLANT")) return 30.00;
  if (p.includes("NIGHTGUARD")) return 10.00;
  return 15.00; // Default for Crowns, Inlays, etc.
}

export default function RemakeOptions({ data, onChange }: Props) {
  const insurancePrice = getInsurancePrice(data.product);

  const handleToggle = () => {
    const newValue = !data.isRemake;
    onChange({ 
      isRemake: newValue, 
      hasRemakeInsurance: false, 
      remakeType: newValue ? "CUSTOMER" : undefined,
      originalCaseId: newValue ? "" : undefined
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-lg font-medium text-foreground">Remake & Insurance</h2>
        
        {/* ✅ BULLETPROOF, STATE-DRIVEN TOGGLE */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleToggle}
          role="switch"
          aria-checked={data.isRemake}
          tabIndex={0}
        >
          <span className="text-sm font-medium text-muted group-hover:text-foreground transition-colors">
            Is this a Remake?
          </span>
          
          {/* The Pill: Always visible, subtle border */}
          <div 
            className="relative w-12 h-6 rounded-full border border-border flex items-center px-1 transition-colors duration-200"
            style={{ backgroundColor: 'var(--surface-highlight)' }}
          >
            {/* The Dot: Explicitly driven by React State. Pure Foreground when checked, Muted when off. */}
            <div 
              className="w-4 h-4 rounded-full shadow-sm transform transition-all duration-200"
              style={{
                backgroundColor: data.isRemake ? 'var(--foreground)' : 'var(--muted)',
                transform: data.isRemake ? 'translateX(22px)' : 'translateX(0px)'
              }}
            />
          </div>
        </div>
      </div>

      {data.isRemake ? (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Liability (Who Pays?)</label>
                <select
                    value={data.remakeType || "CUSTOMER"}
                    onChange={(e) => onChange({ remakeType: e.target.value as any })}
                    className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground outline-none transition-all cursor-pointer shadow-sm"
                >
                    <option value="CUSTOMER" className="bg-surface">Customer Liable (Full Charge)</option>
                    <option value="PRODUCTION" className="bg-surface">Production Error (Haus Pays)</option>
                    <option value="DESIGN" className="bg-surface">Design Error (Designer Pays)</option>
                    <option value="FREE" className="bg-surface">Free / Warranty (No Charge)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Original Case ID (Optional)</label>
                <input
                    type="text"
                    value={data.originalCaseId || ""}
                    onChange={(e) => onChange({ originalCaseId: e.target.value })}
                    placeholder="Paste ID of the case being remade"
                    className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground outline-none transition-all placeholder:text-muted shadow-sm"
                />
            </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface-highlight cursor-pointer hover:border-foreground/30 transition-colors shadow-sm">
                <input 
                    type="checkbox" 
                    checked={data.hasRemakeInsurance}
                    onChange={(e) => onChange({ hasRemakeInsurance: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-border text-foreground focus:ring-foreground focus:ring-offset-background bg-background cursor-pointer"
                />
                <div>
                    <div className="font-bold text-foreground">Add Remake Insurance (+ ${insurancePrice.toFixed(2)}/unit)</div>
                    <div className="text-sm text-muted mt-0.5">Covers 1 free remake for any reason within 30 days of delivery.</div>
                </div>
            </label>
        </div>
      )}
    </div>
  );
}