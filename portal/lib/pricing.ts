// portal/lib/pricing.ts
import { CLIENT_PRICING, resolveProductKey } from "./financial_config";

// Re-export constants for UI components
export const PriceTier = {
  STANDARD: "STANDARD",
  IN_HOUSE: "IN_HOUSE",
} as const;

export const ProductKind = {
  ZIRCONIA: "ZIRCONIA",
  MULTILAYER_ZIRCONIA: "MULTILAYER_ZIRCONIA",
  EMAX: "EMAX",
  INLAY_ONLAY: "INLAY_ONLAY",
  NIGHTGUARD: "NIGHTGUARD",
} as const;

export const BillingType = {
  BILLABLE: "BILLABLE",
  WARRANTY: "WARRANTY",
} as const;

export function countUnits(toothCodes: string | null): number {
  if (!toothCodes) return 0;
  const units = toothCodes.split(",").map(s => s.trim()).filter(s => s !== "");
  return units.length;
}

export function calculateCaseCost(
  tier: string,       
  product: string,    
  units: number,
  billingType: string,
  material: string | null = null // Added material
): number {
  if (billingType === BillingType.WARRANTY) {
    return 0.00;
  }

  // Use the shared config
  const key = resolveProductKey(product, material);
  const safeTier = tier === "IN_HOUSE" ? "IN_HOUSE" : "STANDARD";
  
  const unitPrice = CLIENT_PRICING[safeTier][key] || 0;

  return unitPrice * units;
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}