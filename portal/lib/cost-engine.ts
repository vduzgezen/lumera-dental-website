// portal/lib/cost-engine.ts
import { VENDOR_COSTS, resolveProductKey } from "./financial_config";

export function calculateProductionCosts(
  product: string,
  material: string | null,
  units: number
) {
  const key = resolveProductKey(product, material);
  
  // Cost Calculations
  const unitMillingCost = VENDOR_COSTS.HAUS_MILLING[key] || 0;
  const unitDesignCost = VENDOR_COSTS.DESIGN_FEE[key] || 0;

  return {
    milling: unitMillingCost * units,
    design: unitDesignCost * units,
    total: (unitMillingCost + unitDesignCost) * units
  };
}