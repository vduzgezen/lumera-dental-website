// portal/components/new-case/types.ts

export type ProductType = "ZIRCONIA" | "EMAX" | "NIGHTGUARD" | "INLAY_ONLAY";
export type MaterialType = "HT" | "ML" | "HARD" | "SOFT" | null;
export type ServiceLevel = "IN_HOUSE" | "STANDARD";

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
  product: ProductType;
  material: MaterialType;
  serviceLevel: ServiceLevel;
  shade: string;
  designPreferences: string;
  
  toothCodes: string[];
  
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
  
  product: "ZIRCONIA",
  material: "HT",
  serviceLevel: "STANDARD",
  shade: "",
  designPreferences: "",
  
  toothCodes: [],
  
  scanHtml: null,
  rxPdf: null,
  constructionInfo: null,
  modelTop: null,
  modelBottom: null,
};