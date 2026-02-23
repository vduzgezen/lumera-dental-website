// portal/lib/financial_config.ts

// ============================================================
// PRODUCT MATRIX - Explicit composite keys for scalability
// Format: {RESTORATION_TYPE}_{MATERIAL}
// ============================================================

export const PRODUCT_KEYS = {
  // Crowns (Legacy default restoration type)
  CROWN_ZIRCONIA_HT: "CROWN_ZIRCONIA_HT",
  CROWN_ZIRCONIA_ML: "CROWN_ZIRCONIA_ML",
  CROWN_EMAX: "CROWN_EMAX",
  
  // Implants (New)
  IMPLANT_ZIRCONIA_HT: "IMPLANT_ZIRCONIA_HT",
  IMPLANT_ZIRCONIA_ML: "IMPLANT_ZIRCONIA_ML",
  IMPLANT_EMAX: "IMPLANT_EMAX",
  
  // Inlay/Onlay
  INLAY_ONLAY_ZIRCONIA_HT: "INLAY_ONLAY_ZIRCONIA_HT", // ✅ Updated to HT Zirconia
  
  // Nightguards
  NIGHTGUARD_HARD: "NIGHTGUARD_HARD",
  NIGHTGUARD_SOFT: "NIGHTGUARD_SOFT",
  
  // Legacy support (deprecated, map to new keys)
  ZIRCONIA_HT: "ZIRCONIA_HT",
  ZIRCONIA_ML: "ZIRCONIA_ML",
  EMAX: "EMAX",
} as const;

export type ProductKey = keyof typeof PRODUCT_KEYS;

export const SALES_COMMISSION_PER_UNIT = 1.00;

// ============================================================
// 1. REVENUE: What we charge Clinics (Per Unit)
// ============================================================

export const CLIENT_PRICING = {
  IN_HOUSE: {
    // Crowns
    [PRODUCT_KEYS.CROWN_ZIRCONIA_HT]: 55.00,
    [PRODUCT_KEYS.CROWN_ZIRCONIA_ML]: 65.00,
    [PRODUCT_KEYS.CROWN_EMAX]: 115.00,
    // Implants (Base: $235, +$10 for ML, +$60 for Emax)
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_HT]: 235.00,
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_ML]: 245.00,
    [PRODUCT_KEYS.IMPLANT_EMAX]: 295.00,
    // Inlay/Onlay
    [PRODUCT_KEYS.INLAY_ONLAY_ZIRCONIA_HT]: 115.00, // ✅ Updated
    // Nightguards
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 55.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 55.00,
    // Legacy mappings
    [PRODUCT_KEYS.ZIRCONIA_HT]: 55.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 65.00,
    [PRODUCT_KEYS.EMAX]: 115.00,
  },
  STANDARD: {
    // Crowns
    [PRODUCT_KEYS.CROWN_ZIRCONIA_HT]: 65.00,
    [PRODUCT_KEYS.CROWN_ZIRCONIA_ML]: 75.00,
    [PRODUCT_KEYS.CROWN_EMAX]: 125.00,
    // Implants (Base: $250, +$10 for ML, +$60 for Emax)
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_HT]: 250.00,
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_ML]: 260.00,
    [PRODUCT_KEYS.IMPLANT_EMAX]: 310.00,
    // Inlay/Onlay
    [PRODUCT_KEYS.INLAY_ONLAY_ZIRCONIA_HT]: 125.00, // ✅ Updated
    // Nightguards
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 65.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 65.00,
    // Legacy mappings
    [PRODUCT_KEYS.ZIRCONIA_HT]: 65.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 75.00,
    [PRODUCT_KEYS.EMAX]: 125.00,
  },
};

// ============================================================
// 2. COSTS: What we pay Vendors (Per Unit)
// ============================================================

export const VENDOR_COSTS = {
  HAUS_MILLING: {
    // Crowns
    [PRODUCT_KEYS.CROWN_ZIRCONIA_HT]: 30.00,
    [PRODUCT_KEYS.CROWN_ZIRCONIA_ML]: 37.00,
    [PRODUCT_KEYS.CROWN_EMAX]: 85.00,
    // Implants (Haus Cost: HT $109, ML $116, Emax $164)
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_HT]: 109.00,
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_ML]: 116.00,
    [PRODUCT_KEYS.IMPLANT_EMAX]: 164.00,
    // Inlay/Onlay
    [PRODUCT_KEYS.INLAY_ONLAY_ZIRCONIA_HT]: 85.00, // ✅ Updated
    // Nightguards
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 35.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 35.00,
    // Legacy mappings
    [PRODUCT_KEYS.ZIRCONIA_HT]: 30.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 37.00,
    [PRODUCT_KEYS.EMAX]: 85.00,
  },
  DESIGN_FEE: {
    // Crowns
    [PRODUCT_KEYS.CROWN_ZIRCONIA_HT]: 5.00,
    [PRODUCT_KEYS.CROWN_ZIRCONIA_ML]: 5.00,
    [PRODUCT_KEYS.CROWN_EMAX]: 5.00,
    // Implants (same design fee)
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_HT]: 5.00,
    [PRODUCT_KEYS.IMPLANT_ZIRCONIA_ML]: 5.00,
    [PRODUCT_KEYS.IMPLANT_EMAX]: 5.00,
    // Inlay/Onlay
    [PRODUCT_KEYS.INLAY_ONLAY_ZIRCONIA_HT]: 5.00, // ✅ Updated
    // Nightguards (no design fee)
    [PRODUCT_KEYS.NIGHTGUARD_HARD]: 0.00,
    [PRODUCT_KEYS.NIGHTGUARD_SOFT]: 0.00,
    // Legacy mappings
    [PRODUCT_KEYS.ZIRCONIA_HT]: 5.00,
    [PRODUCT_KEYS.ZIRCONIA_ML]: 5.00,
    [PRODUCT_KEYS.EMAX]: 5.00,
  },
};

// ============================================================
// Helper: Map database string to ProductKey
// Handles both new composite keys AND legacy strings
// ============================================================

export function resolveProductKey(product: string, material?: string | null): ProductKey {
  const p = (product || "").toUpperCase().trim();
  const m = (material || "").toUpperCase().trim();

  // If it's already a valid composite key, return it
  if (PRODUCT_KEYS[p as ProductKey]) {
    return PRODUCT_KEYS[p as ProductKey];
  }

  // Legacy mapping: "ZIRCONIA" -> CROWN_ZIRCONIA_{HT|ML}
  if (p === "ZIRCONIA" || p === "ZIRCONIA_HT" || p === "ZIRCONIA_ML") {
    const isMultilayer = m === "ML" || m === "MULTILAYER" || p === "ZIRCONIA_ML";
    return isMultilayer ? "CROWN_ZIRCONIA_ML" : "CROWN_ZIRCONIA_HT";
  }

  // Legacy mapping: "EMAX" -> CROWN_EMAX
  if (p === "EMAX") {
    return "CROWN_EMAX";
  }

  // Legacy mapping: "NIGHTGUARD" -> NIGHTGUARD_{HARD|SOFT}
  if (p === "NIGHTGUARD") {
    return m === "SOFT" ? "NIGHTGUARD_SOFT" : "NIGHTGUARD_HARD";
  }

  // Legacy mapping: "INLAY_ONLAY" -> INLAY_ONLAY_ZIRCONIA_HT
  if (p === "INLAY_ONLAY" || p === "INLAY" || p === "ONLAY") {
    return "INLAY_ONLAY_ZIRCONIA_HT"; // ✅ Updated
  }

  // Legacy mapping: "IMPLANT" -> IMPLANT_ZIRCONIA_HT (default)
  if (p === "IMPLANT") {
    if (m === "ML" || m === "MULTILAYER" || m === "ZIRCONIA_ML") {
      return "IMPLANT_ZIRCONIA_ML";
    }
    if (m === "EMAX") {
      return "IMPLANT_EMAX";
    }
    return "IMPLANT_ZIRCONIA_HT";
  }

  // Partial matching for composite keys with missing type
  // e.g., if someone stored just "ZIRCONIA_HT" without "CROWN_"
  if (p.includes("ZIRCONIA_HT")) return "CROWN_ZIRCONIA_HT";
  if (p.includes("ZIRCONIA_ML")) return "CROWN_ZIRCONIA_ML";
  if (p.includes("NIGHTGUARD_HARD")) return "NIGHTGUARD_HARD";
  if (p.includes("NIGHTGUARD_SOFT")) return "NIGHTGUARD_SOFT";

  // Default fallback
  return "CROWN_ZIRCONIA_HT";
}

// ============================================================
// Helper: Synthesize product key from UI selections
// Used by the New Case Form
// ============================================================

export interface ProductSelection {
  restorationType: "CROWN" | "IMPLANT" | "INLAY_ONLAY" | "NIGHTGUARD";
  material: "ZIRCONIA_HT" | "ZIRCONIA_ML" | "EMAX" | "HARD" | "SOFT";
  retentionType?: "SCREW" | "CEMENT"; // Only for implants, stored in notes
}

export function synthesizeProductKey(selection: ProductSelection): string {
  const { restorationType, material } = selection;
  
  if (restorationType === "NIGHTGUARD") {
    return `NIGHTGUARD_${material}`;
  }
  
  return `${restorationType}_${material}`;
}