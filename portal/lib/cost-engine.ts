// portal/lib/cost-engine.ts
import { VENDOR_COSTS, SALES_COMMISSION_PER_UNIT, resolveProductKey } from "./financial_config";

export function calculateProductionCosts(
  product: string,
  material: string | null,
  units: number,
  hasSalesRep: boolean // ✅ This was missing
) {
  const key = resolveProductKey(product, material);
  
  // Cost Calculations
  const unitMillingCost = VENDOR_COSTS.HAUS_MILLING[key] || 0;
  const unitDesignCost = VENDOR_COSTS.DESIGN_FEE[key] || 0;
  
  // ✅ Commission Logic
  const unitCommission = hasSalesRep ? SALES_COMMISSION_PER_UNIT : 0;

  return {
    milling: unitMillingCost * units,
    design: unitDesignCost * units,
    commission: unitCommission * units, // ✅ Return this property
    total: (unitMillingCost + unitDesignCost + unitCommission) * units
  };
}