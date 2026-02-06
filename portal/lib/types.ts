// portal/lib/types.ts

export type Role = "customer" | "lab" | "admin" | "milling" | "sales";

export type CaseStatus = 
  | "IN_DESIGN" 
  | "READY_FOR_REVIEW" 
  | "CHANGES_REQUESTED" 
  | "APPROVED" 
  | "IN_MILLING" 
  | "SHIPPED" 
  | "COMPLETED"   // Arrived at Clinic
  | "DELIVERED";  // Given to Patient

// ✅ DELIVERED is now the final stage
export type ProductionStage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED" | "DELIVERED";