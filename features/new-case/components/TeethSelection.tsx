// portal/features/new-case/components/TeethSelection.tsx
"use client";

import { useEffect, useMemo } from "react";
import { CaseData, ServiceLevel } from "./types";
import ToothSelector from "@/components/dentistry/ToothSelector";
import { formatProductName } from "@/lib/pricing";

interface TeethSelectionProps {
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

// ✅ HELPER: Check for Adjacency (Universal System 1-32)
function areTeethAdjacent(codes: string[]): boolean {
  const numbers = codes
    .map((c) => parseInt(c, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (numbers.length < 2) return false;

  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i + 1] !== numbers[i] + 1) {
      return false;
    }
  }
  return true;
}

export default function TeethSelection({ data, update }: TeethSelectionProps) {
  
  const isNightguard = data.product.includes("NIGHTGUARD");

  // --- LOGIC: Bridge Eligibility ---
  const showBridgeOption = useMemo(() => {
    // Only for crowns and implants with zirconia or emax
    const validProduct = data.product.includes("CROWN") || data.product.includes("IMPLANT");
    if (!validProduct) return false;
    
    // Must be numeric teeth (not "Full Arch" etc)
    const hasSpecialCodes = data.toothCodes.some(c => isNaN(parseInt(c)));
    if (hasSpecialCodes) return false;

    return areTeethAdjacent(data.toothCodes);
  }, [data.product, data.toothCodes]);

  // ✅ EFFECT: Auto-reset isBridge if conditions aren't met
  useEffect(() => {
    if (!showBridgeOption && data.isBridge) {
      update({ isBridge: false });
    }
  }, [showBridgeOption, data.isBridge, update]);

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

  // Auto-set nightguard to Full Arch
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
  }, [isNightguard, data.toothCodes, update]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6 shadow-lg transition-colors duration-200">
      <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">
        Prescription & Teeth
      </h2>

      {/* 1. PRODUCT DISPLAY & SERVICE LEVEL (Clean, Price-Free Layout) */}
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Product Box */}
        <div className="flex-1 p-4 rounded-lg bg-surface-highlight border border-border flex flex-col justify-center">
          <span className="text-xs text-muted uppercase tracking-wider mb-1">Selected Product</span>
          <div className="text-lg font-bold text-foreground capitalize">
            {formatProductName(data.product, data.isBridge)}
          </div>
          <div className="text-xs text-muted mt-1">
            Change product selection above
          </div>
        </div>

        {/* Service Level Toggle Box */}
        <div className="flex-1 p-4 rounded-lg bg-surface border border-border transition-colors duration-200 flex flex-col justify-center">
          <span className="text-xs text-muted uppercase tracking-wider mb-2">Service Level</span>
          <div className="flex gap-2">
            {(["IN_HOUSE", "STANDARD"] as ServiceLevel[]).map((level) => (
              <label 
                key={level} 
                className={`flex-1 flex items-center justify-center gap-2 cursor-pointer py-2 px-3 rounded-lg border transition-all duration-200 shadow-sm
                ${data.serviceLevel === level 
                  // ✅ FIX: Uses semantic foreground/background for perfect theme switching
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-surface-highlight text-muted border-border hover:bg-[var(--accent-dim)] hover:text-foreground"}`}
              >
                <input 
                  type="radio" 
                  name="serviceLevel" 
                  checked={data.serviceLevel === level}
                  onChange={() => update({ serviceLevel: level })}
                  className="hidden" // Hide the actual radio circle for a cleaner button look
                />
                <span className="text-sm font-bold tracking-wide">
                  {level.replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* 2. SHADE LAYERING (Not for nightguards) */}
      {!isNightguard && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Shade Layering</label>
          <div className="grid grid-cols-3 gap-2">
             <div className="space-y-1">
              <input
                value={shadeParts.body}
                onChange={(e) => updateShade("body", e.target.value)}
                placeholder="Body (A2)"
                className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder:text-muted transition-colors duration-200"
              />
              <div className="text-[10px] text-accent text-center font-bold uppercase tracking-wider">Body *</div>
            </div>
            <div className="space-y-1">
              <input
                value={shadeParts.incisal}
                onChange={(e) => updateShade("incisal", e.target.value)}
                placeholder="Matching Body"
                className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder:text-muted transition-colors duration-200"
              />
              <div className="text-[10px] text-muted text-center uppercase tracking-wider">Incisal</div>
            </div>
            <div className="space-y-1">
              <input
                value={shadeParts.gingival}
                onChange={(e) => updateShade("gingival", e.target.value)}
                placeholder="Matching Body"
                className="w-full rounded-lg bg-surface-highlight border border-border px-3 py-2 text-foreground outline-none focus:border-accent/50 text-center placeholder:text-muted transition-colors duration-200"
              />
              <div className="text-[10px] text-muted text-center uppercase tracking-wider">Gingival</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TOOTH SELECTOR */}
      {!isNightguard && (
        <div className="space-y-2">
           <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-4">
                 <h3 className="text-sm font-medium text-muted">Select Teeth <span className="text-accent">*</span></h3>
                 
                 {/* ✅ BRIDGE CHECKBOX */}
                 {showBridgeOption && (
                   <label className="flex items-center gap-2 cursor-pointer group animate-in fade-in zoom-in duration-300">
                      <input 
                          type="checkbox" 
                          checked={data.isBridge} 
                          onChange={(e) => update({ isBridge: e.target.checked })}
                          className="accent-accent w-4 h-4 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors ${data.isBridge ? "text-accent" : "text-muted group-hover:text-foreground"}`}>
                          Bridge Restoration
                      </span>
                   </label>
                 )}
              </div>
              <span className="text-xs text-muted">
                 {data.toothCodes.length > 0 ? `${data.toothCodes.length} selected` : "None"}
              </span>
           </div>
           
           <div className="bg-surface rounded-xl p-4 flex justify-center transition-colors duration-200">
              <ToothSelector 
                value={data.toothCodes.join(",")} 
                onChange={(val) => update({ toothCodes: val.split(",").map(t => t.trim()).filter(Boolean) })} 
              />
           </div>
       </div>
      )}

      {/* 4. DOCTOR PREFERENCES */}
      <div className="space-y-2">
         <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-muted">Doctor Preferences</label>
             <span className="text-[10px] text-muted">Auto-filled from doctor profile</span>
         </div>
         <textarea
           value={data.doctorPreferences || ""}
           onChange={(e) => update({ doctorPreferences: e.target.value })}
           className="w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition-colors duration-200 h-24 resize-none"
         />
         {data.retentionType && (
           <p className="text-xs text-accent">
             Retention Type: {data.retentionType === "SCREW" ? "Screw Retained" : "Cement Retained"}
           </p>
         )}
      </div>
    </div>
  );
}