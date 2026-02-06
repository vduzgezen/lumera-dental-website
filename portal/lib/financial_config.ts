// portal/lib/financial_config.ts

export const PRODUCT_KEYS = {
  ZIRCONIA_HT: "ZIRCONIA_HT",
  ZIRCONIA_ML: "ZIRCONIA_ML",
  EMAX: "EMAX",
  NIGHTGUARD_HARD: "NIGHTGUARD_HARD",
  NIGHTGUARD_SOFT: "NIGHTGUARD_SOFT",
} as const;

export type ProductKey = keyof typeof PRODUCT_KEYS;

export const SALES_COMMISSION_PER_UNIT = 1.00;

// 1. REVENUE: What we charge Clinics (Per Unit)
export const CLIENT_PRICING = {
  IN_HOUSE: {
    [PRODUCT_KEYS.ZIRCONIA_HT]: 55.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 65.00,
    [PRODUCT_KEYS.EMAX]: 115.00,
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 55.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 55.00,
  },
  STANDARD: {
    [PRODUCT_KEYS.ZIRCONIA_HT]: 65.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 75.00,
    [PRODUCT_KEYS.EMAX]: 125.00,
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 65.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 65.00,
  },
};

// 2. COSTS: What we pay Vendors (Per Unit)
export const VENDOR_COSTS = {
  HAUS_MILLING: {
    [PRODUCT_KEYS.ZIRCONIA_HT]: 30.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 37.00,
    [PRODUCT_KEYS.EMAX]: 85.00,
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 35.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 35.00,
  },
  DESIGN_FEE: {
    // $5 per unit for crowns, $0 (pending agreement) for nightguards
    [PRODUCT_KEYS.ZIRCONIA_HT]: 5.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 5.00,
    [PRODUCT_KEYS.EMAX]: 5.00,
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 0.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 0.00,
  },
};

// Helper to map your Database string to these Keys
export function resolveProductKey(product: string, material: string | null): ProductKey {
  const p = (product || "").toUpperCase();
  const m = (material || "").toUpperCase();

  if (p === "ZIRCONIA") {
    return m === "ML" ? "ZIRCONIA_ML" : "ZIRCONIA_HT";
  }
  if (p === "EMAX") return "EMAX";
  if (p === "NIGHTGUARD") {
    return m === "SOFT" ? "NIGHTGUARD_SOFT" : "NIGHTGUARD_HARD";
  }
  if (p === "INLAY_ONLAY") return "EMAX"; // Usually priced same as Emax
  
  // Fallback
  return "ZIRCONIA_HT";
}