// portal/lib/types.ts
// Shared type definitions for the Dental Portal

/**
 * User roles in the system
 */
export type Role = "customer" | "lab" | "admin" | "milling";

/**
 * Case status values representing the workflow state
 */
export type CaseStatus = 
  | "IN_DESIGN" 
  | "READY_FOR_REVIEW" 
  | "CHANGES_REQUESTED" 
  | "APPROVED" 
  | "IN_MILLING" 
  | "SHIPPED" 
  | "COMPLETED";

/**
 * Production stage values representing physical manufacturing stages
 */
export type ProductionStage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED";
