// portal/components/new-case/TeethSelection.tsx
"use client";

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
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-6 shadow-lg">
      <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
        Prescription & Teeth
      </h2>

      {/* 1. PRODUCT & MATERIAL ROW */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Product</label>
          <div className="grid grid-cols-2 gap-2">
            {(["ZIRCONIA", "EMAX", "NIGHTGUARD", "INLAY_ONLAY"] as ProductType[]).map((type) => (
               <button
                 key={type}
                 type="button"
                 onClick={() => handleProductChange(type)}
                 className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border
                   ${data.product === type 
                     ? "bg-blue-600 border-blue-500 text-white" 
                     : "bg-black/40 border-white/10 text-white/50 hover:bg-white/10"
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
               <label className="text-sm font-medium text-white/70">Zirconia Material</label>
               <div className="flex gap-2">
                 {(["HT", "ML"] as MaterialType[]).map(m => (
                    <button key={m} type="button" onClick={() => update({ material: m })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${data.material === m ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-black/40 border-white/10 text-white/40"}`}>
                      {m}
                    </button>
                 ))}
               </div>
             </div>
           )}
           
           {data.product === "NIGHTGUARD" && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-white/70">Material Hardness</label>
               <div className="flex gap-2">
                 {(["HARD", "SOFT"] as MaterialType[]).map(m => (
                    <button key={m} type="button" onClick={() => update({ material: m })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${data.material === m ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-black/40 border-white/10 text-white/40"}`}>
                      {m}
                    </button>
                 ))}
               </div>
             </div>
           )}

           <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Shade</label>
              <input
                value={data.shade}
                onChange={(e) => update({ shade: e.target.value })}
                placeholder="e.g. A2"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2 text-white outline-none focus:border-blue-500/50"
              />
           </div>
        </div>
      </div>

      {/* 2. PRICING TIER (Updated UI) */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex gap-4 w-full md:w-auto">
              {(["IN_HOUSE", "STANDARD"] as ServiceLevel[]).map((level) => (
                <label key={level} className={`flex-1 md:flex-none flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${data.serviceLevel === level ? "bg-blue-500/10 border-blue-500/50" : "border-transparent hover:bg-white/5"}`}>
                  <input 
                    type="radio" 
                    name="serviceLevel" 
                    checked={data.serviceLevel === level}
                    onChange={() => update({ serviceLevel: level })}
                    className="accent-blue-500"
                  />
                  {/* ✅ REMOVED: Subtext descriptions */}
                  <span className={`text-sm font-bold ${data.serviceLevel === level ? "text-blue-400" : "text-white/60"}`}>
                    {level.replace("_", " ")}
                  </span>
                </label>
              ))}
           </div>
           <div className="text-right">
             <span className="text-xs text-white/40 block">Estimated Unit Price</span>
             <span className="text-2xl font-bold text-emerald-400">${currentPrice}</span>
           </div>
        </div>
      </div>

      {/* 3. TOOTH SELECTOR */}
      <div className="space-y-2">
         <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-medium text-white/70">Select Teeth <span className="text-blue-400">*</span></h3>
            <span className="text-xs text-white/40">
               {data.toothCodes.length > 0 ? `${data.toothCodes.length} selected` : "None"}
            </span>
         </div>
         
         <div className="bg-black/40 rounded-xl border border-white/10 p-4 flex justify-center">
            <ToothSelector 
              value={data.toothCodes.join(",")} 
              onChange={(val) => update({ toothCodes: val.split(",").map(t => t.trim()).filter(Boolean) })} 
            />
         </div>
      </div>

      {/* 4. DESIGN PREFERENCES */}
      <div className="space-y-2">
         <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-white/70">Designer Preferences</label>
             <span className="text-[10px] text-white/40">Auto-filled from doctor profile</span>
         </div>
         <textarea
           value={data.designPreferences}
           onChange={(e) => update({ designPreferences: e.target.value })}
           placeholder="E.g. Contacts heavy, light occlusion, open embrasures..."
           className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition h-24 resize-none"
         />
      </div>

    </div>
  );
}