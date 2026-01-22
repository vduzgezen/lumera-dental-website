// portal/components/new-case/types.ts

// 1. Doctor Type
export type Doctor = {
  id: string;
  email: string;
  name: string | null;
  preferenceNote: string | null;
  defaultDesignPreferences: string | null;
  clinic: { id: string; name: string };
};

// 2. Product List (Names only - Prices are in lib/pricing.ts)
export type ProductKind = "ZIRCONIA" | "MULTILAYER_ZIRCONIA" | "EMAX" | "INLAY_ONLAY";

// 3. Main State Interface
export interface NewCaseState {
  doctorUserId: string;
  patientAlias: string;
  toothCodes: string;
  orderDate: string; // YYYY-MM-DD
  product: ProductKind; 
  shade: string;
  material: string;
  designPreferences: string;
  
  // Files
  scanHtml: File | null;
  rxPdf: File | null;
  constructionInfo: File | null;
  modelTop: File | null;
  modelBottom: File | null;
}