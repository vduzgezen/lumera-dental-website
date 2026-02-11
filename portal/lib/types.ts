// FILE: lib/types.ts

export type Role = "customer" | "lab" | "admin" | "milling" | "sales";

export type CaseStatus = 
  | "IN_DESIGN" 
  | "READY_FOR_REVIEW" 
  | "CHANGES_REQUESTED" 
  | "APPROVED" 
  | "IN_MILLING" 
  | "SHIPPED" 
  | "COMPLETED" 
  | "DELIVERED";

export type ProductionStage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED" | "DELIVERED";

// ✅ NEW: Shared Shipping Address Type
export interface ShippingTarget {
  name: string;
  attn: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}