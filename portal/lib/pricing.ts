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
  IMPLANT: "IMPLANT",
  CROWN: "CROWN",
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

// ============================================================
// GLOBAL FORMATTER: Convert product key to user-friendly name
// ============================================================

/**
 * Formats a raw database product string into a clean, user-friendly display name.
 * 
 * Examples:
 * - "IMPLANT_ZIRCONIA_ML" -> "Implant Zirconia ML"
 * - "CROWN_EMAX" -> "Crown Emax"
 * - "NIGHTGUARD_SOFT" -> "Nightguard Soft"
 * - "ZIRCONIA" (legacy) -> "Zirconia Crown"
 * - "EMAX" (legacy) -> "Emax Crown"
 * 
 * @param product - The raw product key from database
 * @param isBridge - Optional flag to append "Bridge" to the name
 */
export function formatProductName(product: string | null | undefined, isBridge?: boolean): string {
  if (!product) return "Unknown Product";

  const p = product.toUpperCase().trim();
  let result = "";

  // Handle new composite keys
  if (p.includes("_")) {
    // Split by underscore and capitalize each part
    result = p
      .split("_")
      .map(word => {
        // Special abbreviations that should stay uppercase
        if (word === "HT" || word === "ML") return word;
        // Handle EMAX -> Emax
        if (word === "EMAX") return "Emax";
        // Default: capitalize first letter
        return word.charAt(0) + word.slice(1).toLowerCase();
      })
      .join(" ");
  } else {
    // Legacy single-word mappings
    const legacyMap: Record<string, string> = {
      "ZIRCONIA": "Zirconia Crown",
      "ZIRCONIA_HT": "Zirconia HT Crown",
      "ZIRCONIA_ML": "Zirconia ML Crown",
      "EMAX": "Emax Crown",
      "NIGHTGUARD": "Nightguard",
      "NIGHTGUARD_HARD": "Hard Nightguard",
      "NIGHTGUARD_SOFT": "Soft Nightguard",
      "INLAY_ONLAY": "Inlay/Onlay",
      "IMPLANT": "Implant Crown",
    };

    result = legacyMap[p] || (p.charAt(0) + p.slice(1).toLowerCase());
  }

  // Append "Bridge" if isBridge flag is true
  if (isBridge) {
    result += " Bridge";
  }

  return result;
}

// ============================================================
// Helper: Get restoration type from product key
// ============================================================

export function getRestorationType(product: string): string {
  const p = product.toUpperCase();
  if (p.startsWith("IMPLANT")) return "Implant";
  if (p.startsWith("CROWN")) return "Crown";
  if (p.startsWith("INLAY_ONLAY")) return "Inlay/Onlay";
  if (p.startsWith("NIGHTGUARD")) return "Nightguard";
  return "Crown"; // Default
}

// ============================================================
// Helper: Get material from product key
// ============================================================

export function getMaterial(product: string): string {
  const p = product.toUpperCase();
  if (p.includes("ZIRCONIA_HT")) return "Zirconia HT";
  if (p.includes("ZIRCONIA_ML")) return "Zirconia ML";
  if (p.includes("EMAX")) return "Emax";
  if (p.includes("HARD")) return "Hard";
  if (p.includes("SOFT")) return "Soft";
  return "Zirconia HT"; // Default
}
