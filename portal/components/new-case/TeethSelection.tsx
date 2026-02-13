// portal/components/new-case/TeethSelection.tsx
"use client";

import { useEffect, useMemo } from "react";
import { CaseData, ProductType, MaterialType, ServiceLevel } from "./types";
import ToothSelector from "@/components/ToothSelector";

interface TeethSelectionProps {
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

const PRICING = {
  ZIRCONIA: { HT: { IN_HOUSE: 55, STANDARD: 65 }, ML: { IN_HOUSE: 65, STANDARD: 75 } },
  EMAX: { default: { IN_HOUSE: 110, STANDARD: 120 } },
  NIGHTGUARD: { HARD: { IN_HOUSE: 50, STANDARD: 60 }, SOFT: { IN_HOUSE: 50, STANDARD: 60 } },
  INLAY_ONLAY: { default: { IN_HOUSE: 65, STANDARD: 75 } }
};

export default function TeethSelection({ data, update }: TeethSelectionProps) {
  
  const isNightguard = data.product === "NIGHTGUARD";

  // --- SHADE LOGIC ---
  const shadeParts = useMemo(() => {
    if (!data.shade) return { incisal: "", body: "", gingival: "" };
    
    if (data.shade.includes("/")) {
      const parts = data.shade.split("/");
      return {
        incisal: parts[0] || "",
        body: parts[1] || "",
        gingival: parts[2] || ""
      };
    }
    
    return { incisal: "", body: data.shade, gingival: "" };
  }, [data.shade]);

  const updateShade = (type: "incisal" | "body" | "gingival", value: string) => {
    const newParts = { ...shadeParts, [type]: value };
    
    if (!newParts.incisal && !newParts.gingival) {
      update({ shade: newParts.body });
      return;
    }

    const b = newParts.body;
    const i = newParts.incisal || b;
    const g = newParts.gingival || b;
    
    update({ shade: `${i}/${b}/${g}` });
  };

  // ✅ Auto-Update for Nightguard (Fixed Dependencies)
  useEffect(() => {
    if (isNightguard) {
      if (data.toothCodes.length === 0 || data.toothCodes[0] !== "Full Arch") {
         update({ toothCodes: ["Full Arch"], shade: "" }); 
      }
    } else {
      if (data.toothCodes.includes("Full Arch")) {
          update({ toothCodes: [] });
      }
    }
  }, [isNightguard, data.toothCodes, update]); // ✅ Added missing deps

  const handleProductChange = (type: ProductType) => {
    let defaultMaterial: MaterialType = null;
    if (type === "ZIRCONIA") defaultMaterial = "HT";
    if (type === "NIGHTGUARD") defaultMaterial = "HARD";
    update({ product: type, material: defaultMaterial });
  };

  const getPrice = () => {
    const { product, material, serviceLevel } = data;
    if (product === "ZIRCONIA" && material) return PRICING.ZIRCONIA[material as "HT"|"ML"]?.[serviceLevel] || 0;
    if (product === "NIGHTGUARD" && material) return PRICING.NIGHTGUARD[material as "HARD"|"SOFT"]?.[serviceLevel] || 0;
    if (product === "EMAX") return PRICING.EMAX.default[serviceLevel] || 0;
    if (product === "INLAY_ONLAY") return PRICING.INLAY_ONLAY.default[serviceLevel] || 0;
    return 0;
  };

  const currentPrice = getPrice();

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-lg">
      <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">
        Prescription & Teeth
      </h2>

      {/* 1. PRODUCT & MATERIAL ROW */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Product</label>
          <div className="grid grid-cols-2 gap-2">
              {(["ZIRCONIA", "EMAX", "NIGHTGUARD", "INLAY_ONLAY"] as ProductType[]).map((type) => (
               <button
                 key={type}
                 type="button"
                 onClick={() => handleProductChange(type)}
                 className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border
                   ${data.product === type 
                     ? "bg-accent border-accent text-white" 
                     : "bg-surface border-border text-muted hover:bg-[var(--accent-dim)]"
                   }`}
              >
                 {type.replace("_", " ")}
               </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
           {data.product === "ZIRCONIA" && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-muted">Zirconia Material</label>
               <div className="flex gap-2">
                 {(["HT", "ML"] as MaterialType[]).map(m => (
                    <button key={m} type="button" onClick={() => update({ material: m })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${data.material === m ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-surface border-border text-muted"}`}>
                      {m}
                    </button>
                 ))}
               </div>
             </div>
           )}
           
           {isNightguard && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-muted">Material Hardness</label>
               <div className="flex gap-2">
                 {(["HARD", "SOFT"] as MaterialType[]).map(m => (
                    <button key={m} type="button" onClick={() => update({ material: m })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${data.material === m ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-surface border-border text-muted"}`}>
                      {m}
                    </button>
                 ))}
               </div>
             </div>
           )}

           {/* SHADE LAYERING */}
           {!isNightguard && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Shade Layering</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <input
                      value={shadeParts.body}
                      onChange={(e) => updateShade("body", e.target.value)}
                      placeholder="Body (A2)"
                      className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder-muted"
                    />
                    <div className="text-[10px] text-accent text-center font-bold uppercase tracking-wider">Body *</div>
                  </div>
                  <div className="space-y-1">
                    <input
                      value={shadeParts.incisal}
                      onChange={(e) => updateShade("incisal", e.target.value)}
                      placeholder="Matching Body"
                      className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder-muted"
                    />
                    <div className="text-[10px] text-muted text-center uppercase tracking-wider">Incisal</div>
                  </div>
                  <div className="space-y-1">
                    <input
                      value={shadeParts.gingival}
                      onChange={(e) => updateShade("gingival", e.target.value)}
                      placeholder="Matching Body"
                      className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder-muted"
                    />
                    <div className="text-[10px] text-muted text-center uppercase tracking-wider">Gingival</div>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* 2. PRICING TIER */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex gap-4 w-full md:w-auto">
              {(["IN_HOUSE", "STANDARD"] as ServiceLevel[]).map((level) => (
                <label key={level} className={`flex-1 md:flex-none flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${data.serviceLevel === level ? "bg-accent/10 border-accent/50" : "border-transparent hover:bg-[var(--accent-dim)]"}`}>
                   <input 
                    type="radio" 
                    name="serviceLevel" 
                    checked={data.serviceLevel === level}
                    onChange={() => update({ serviceLevel: level })}
                    className="accent-accent"
                  />
                  <span className={`text-sm font-bold ${data.serviceLevel === level ? "text-accent" : "text-muted"}`}>
                    {level.replace("_", " ")}
                  </span>
                </label>
              ))}
           </div>
           <div className="text-right">
              <span className="text-xs text-muted block">Estimated Unit Price</span>
             <span className="text-2xl font-bold text-emerald-400">${currentPrice}</span>
           </div>
        </div>
      </div>

      {/* 3. TOOTH SELECTOR */}
      {!isNightguard && (
        <div className="space-y-2">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-medium text-muted">Select Teeth <span className="text-accent">*</span></h3>
              <span className="text-xs text-muted">
                 {data.toothCodes.length > 0 ? `${data.toothCodes.length} selected` : "None"}
              </span>
           </div>
           
           <div className="bg-surface rounded-xl border border-border p-4 flex justify-center">
              <ToothSelector 
                value={data.toothCodes.join(",")} 
                onChange={(val) => update({ toothCodes: val.split(",").map(t => t.trim()).filter(Boolean) })} 
              />
           </div>
        </div>
      )}

      {/* 4. DESIGN PREFERENCES */}
      <div className="space-y-2">
         <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-muted">Designer Preferences</label>
             <span className="text-[10px] text-muted">Auto-filled from doctor profile</span>
         </div>
         <textarea
           value={data.designPreferences}
           onChange={(e) => update({ designPreferences: e.target.value })}
           placeholder="E.g. Contacts heavy, light occlusion, open embrasures..."
           className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 outline-none transition h-24 resize-none"
         />
      </div>

    </div>
  );
}