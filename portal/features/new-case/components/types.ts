// portal/features/new-case/components/types.ts

// ============================================================
// NEW PRODUCT MATRIX TYPES
// ============================================================

export type RestorationType = "CROWN" | "IMPLANT" | "INLAY_ONLAY" | "NIGHTGUARD";
export type CrownMaterial = "ZIRCONIA_HT" | "ZIRCONIA_ML" | "EMAX";
export type ImplantMaterial = "ZIRCONIA_HT" | "ZIRCONIA_ML" | "EMAX";
export type NightguardMaterial = "HARD" | "SOFT";
export type RetentionType = "SCREW" | "CEMENT";
export type ServiceLevel = "IN_HOUSE" | "STANDARD";

// Legacy types for backward compatibility
export type ProductType = "ZIRCONIA" | "EMAX" | "NIGHTGUARD" | "INLAY_ONLAY";
export type MaterialType = "HT" | "ML" | "HARD" | "SOFT" | null;

export interface DoctorRow {
  id: string;
  name: string | null;
  email: string;
  
  // ✅ FIX: Allow clinic to be null (if doctor has no primary clinic)
  clinic: { 
    id: string; 
    name: string; 
    priceTier: string | null;
  } | null;

  // Secondary Clinics
  secondaryClinics: {
    id: string;
    name: string;
    priceTier: string | null;
  }[];
  
  preferenceNote?: string | null;
  defaultDesignPreferences?: string | null;
}

export interface CaseData {
  doctorUserId: string;
  doctorName: string;
  clinicId: string;
  
  patientFirstName: string;
  patientLastName: string;
  patientAlias: string;
  
  orderDate: string; 
  dueDate: string;
  
  // NEW: Product Matrix Selections
  restorationType: RestorationType;
  material: CrownMaterial | ImplantMaterial | NightguardMaterial;
  retentionType?: RetentionType; // Only for implants
  
  // LEGACY: Kept for backward compatibility (synthesized from above)
  product: string; // e.g., "CROWN_ZIRCONIA_HT", "IMPLANT_EMAX"
  
  serviceLevel: ServiceLevel;
  
  // ✅ SHADES
  shade: string;          // Body Shade
  shadeGingival?: string; // Optional
  shadeIncisal?: string;  // Optional
  
  designPreferences: string;
  
  toothCodes: string[];
  isBridge: boolean;      // ✅ NEW: Bridge Flag

  scanHtml: File | null;
  rxPdf: File | null;
  constructionInfo: File | null;
  modelTop: File | null;
  modelBottom: File | null;
}

const today = new Date();
const defaultDue = new Date(today);
defaultDue.setDate(today.getDate() + 8);

export const INITIAL_DATA: CaseData = {
  doctorUserId: "",
  doctorName: "",
  clinicId: "", 
  
  patientFirstName: "",
  patientLastName: "",
  patientAlias: "",
  
  orderDate: today.toISOString().split("T")[0],
  dueDate: defaultDue.toISOString().split("T")[0],
  
  // NEW: Default selections
  restorationType: "CROWN",
  material: "ZIRCONIA_HT",
  retentionType: undefined,
  
  // LEGACY: Synthesized value
  product: "CROWN_ZIRCONIA_HT",
  
  serviceLevel: "STANDARD",
  shade: "",
  shadeGingival: "",
  shadeIncisal: "",
  designPreferences: "",
  
  toothCodes: [],
  isBridge: false, // Default to single unit
  
  scanHtml: null,
  rxPdf: null,
  constructionInfo: null,
  modelTop: null,
  modelBottom: null,
};

// ============================================================
// UI OPTIONS FOR CASCADING DROPDOWNS
// ============================================================

export const RESTORATION_OPTIONS = [
  { value: "CROWN", label: "Crown" },
  { value: "IMPLANT", label: "Implant" },
  { value: "INLAY_ONLAY", label: "Inlay/Onlay" },
  { value: "NIGHTGUARD", label: "Nightguard" },
] as const;

export const CROWN_MATERIAL_OPTIONS = [
  { value: "ZIRCONIA_HT", label: "Zirconia HT" },
  { value: "ZIRCONIA_ML", label: "Zirconia ML" },
  { value: "EMAX", label: "E.max" },
] as const;

export const IMPLANT_MATERIAL_OPTIONS = [
  { value: "ZIRCONIA_HT", label: "Zirconia HT" },
  { value: "ZIRCONIA_ML", label: "Zirconia ML" },
  { value: "EMAX", label: "E.max" },
] as const;

export const INLAY_ONLAY_MATERIAL_OPTIONS = [
  { value: "ZIRCONIA_HT", label: "Zirconia HT" },
] as const;

export const NIGHTGUARD_MATERIAL_OPTIONS = [
  { value: "HARD", label: "Hard" },
  { value: "SOFT", label: "Soft" },
] as const;

export const RETENTION_OPTIONS = [
  { value: "SCREW", label: "Screw Retained" },
  { value: "CEMENT", label: "Cement Retained" },
] as const;

// ============================================================
// HELPER: Synthesize product key from selections
// ============================================================

export function synthesizeProductKey(
  restorationType: RestorationType,
  material: string,
  retentionType?: RetentionType
): string {
  if (restorationType === "NIGHTGUARD") {
    return `NIGHTGUARD_${material}`;
  }
  return `${restorationType}_${material}`;
}

// ============================================================
// HELPER: Get available materials for restoration type
// ============================================================

export function getMaterialOptions(restorationType: RestorationType) {
  switch (restorationType) {
    case "CROWN":
      return CROWN_MATERIAL_OPTIONS;
    case "IMPLANT":
      return IMPLANT_MATERIAL_OPTIONS;
    case "INLAY_ONLAY":
      return INLAY_ONLAY_MATERIAL_OPTIONS;
    case "NIGHTGUARD":
      return NIGHTGUARD_MATERIAL_OPTIONS;
    default:
      return CROWN_MATERIAL_OPTIONS;
  }
}

// ============================================================
// HELPER: Get default material for restoration type
// ============================================================

export function getDefaultMaterial(restorationType: RestorationType): string {
  switch (restorationType) {
    case "CROWN":
      return "ZIRCONIA_HT";
    case "IMPLANT":
      return "ZIRCONIA_HT";
    case "INLAY_ONLAY":
      return "ZIRCONIA_HT";
    case "NIGHTGUARD":
      return "HARD";
    default:
      return "ZIRCONIA_HT";
  }
}
