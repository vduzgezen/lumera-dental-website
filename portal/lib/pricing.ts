// portal/lib/pricing.ts

// Define constants to replace the missing Prisma Enums
export const PriceTier = {
  STANDARD: "STANDARD",
  IN_HOUSE: "IN_HOUSE",
} as const;

export const ProductKind = {
  ZIRCONIA: "ZIRCONIA",
  MULTILAYER_ZIRCONIA: "MULTILAYER_ZIRCONIA",
  EMAX: "EMAX",
  INLAY_ONLAY: "INLAY_ONLAY",
} as const;

export const BillingType = {
  BILLABLE: "BILLABLE",
  WARRANTY: "WARRANTY",
} as const;

// Types for TypeScript safety
export type PriceTierType = typeof PriceTier[keyof typeof PriceTier];
export type ProductKindType = typeof ProductKind[keyof typeof ProductKind];
export type BillingTypeType = typeof BillingType[keyof typeof BillingType];

const PRICING_MATRIX = {
  [PriceTier.STANDARD]: {
    [ProductKind.ZIRCONIA]: 65.00,
    [ProductKind.MULTILAYER_ZIRCONIA]: 72.00,
    [ProductKind.EMAX]: 109.00,
    [ProductKind.INLAY_ONLAY]: 109.00,
  },
  [PriceTier.IN_HOUSE]: {
    [ProductKind.ZIRCONIA]: 55.00,
    [ProductKind.MULTILAYER_ZIRCONIA]: 62.00,
    [ProductKind.EMAX]: 99.00,
    [ProductKind.INLAY_ONLAY]: 99.00,
  },
};

export function countUnits(toothCodes: string | null): number {
  if (!toothCodes) return 0;
  const units = toothCodes.split(",").map(s => s.trim()).filter(s => s !== "");
  return units.length;
}

export function calculateCaseCost(
  tier: string,       // changed from Enum to string
  product: string,    // changed from Enum to string
  units: number,
  billingType: string // changed from Enum to string
): number {
  if (billingType === BillingType.WARRANTY) {
    return 0.00;
  }

  // Safe Casts / Defaults
  const t = (PRICING_MATRIX as any)[tier] ? tier : PriceTier.STANDARD;
  const p = product || ProductKind.ZIRCONIA;

  const tierPrices = (PRICING_MATRIX as any)[t];
  const basePrice = tierPrices[p] || 0;

  return basePrice * units;
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}