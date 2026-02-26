// portal/lib/cost-engine.ts
import { VENDOR_COSTS, SALES_COMMISSION_PER_UNIT, resolveProductKey } from "./financial_config";

export function calculateProductionCosts(
  product: string,
  material: string | null,
  units: number,
  hasSalesRep: boolean,
  isRemake?: boolean,         // ✅ ADDED REMAKE PARAMS
  remakeType?: string | null  // ✅ ADDED REMAKE PARAMS
) {
  const key = resolveProductKey(product, material);

  // 1. Base Costs
  let unitMillingCost = VENDOR_COSTS.MILLING[key] || 0;
  let unitDesignCost = VENDOR_COSTS.DESIGN_FEE[key] || 0;
  let unitCommission = hasSalesRep ? SALES_COMMISSION_PER_UNIT : 0;

  // 2. Adjust Vendor Payables based on Remake Liability
  if (isRemake && remakeType) {
      if (remakeType === "PRODUCTION") {
          // Milling center messed up. We don't owe them for the remake puck.
          unitMillingCost = 0;
      } 
      else if (remakeType === "DESIGN") {
          // Designer messed up. We don't pay the design fee. 
          // (We still pay the milling center because they milled the file we sent them)
          unitDesignCost = 0;
      }
      else if (remakeType === "CUSTOMER" || remakeType === "FREE") {
          // If the customer messed up, or we are giving a free courtesy remake,
          // the vendors (Milling Center & Designer) still did their job perfectly and must be paid normally.
          // (The revenue hit was already handled in the API route calculation).
      }
      
      // We generally do not pay sales reps a second commission for a remake of any kind.
      unitCommission = 0; 
  }

  return {
    milling: unitMillingCost * units,
    design: unitDesignCost * units,
    commission: unitCommission * units,
    total: (unitMillingCost + unitDesignCost + unitCommission) * units
  };
}
