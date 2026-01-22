// portal/lib/schemas.ts
import { z } from "zod";
import { ProductKind, BillingType } from "@/lib/pricing";

// --- EXISTING CASE SCHEMAS (Keep these) ---
const ProductEnum = z.nativeEnum(ProductKind);
const BillingEnum = z.nativeEnum(BillingType);

const FileSchema = z.custom<File>((v) => v instanceof File, {
  message: "Must be a valid file upload",
});

export const CreateCaseSchema = z.object({
  patientAlias: z.string().min(1, "Patient Alias is required"),
  doctorUserId: z.string().min(1, "Doctor ID is required"),
  toothCodes: z.string().min(1, "Tooth Codes are required"),
  orderDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid Order Date",
  }).transform((val) => new Date(val)),
  product: ProductEnum.default(ProductKind.ZIRCONIA),
  billingType: BillingEnum.default(BillingType.BILLABLE),
  shade: z.string().optional(),
  material: z.string().optional(),
  designPreferences: z.string().optional(),
  scanHtml: FileSchema.refine((f) => f.size > 0, "Scan HTML file is empty"),
  rxPdf: FileSchema.refine((f) => f.size > 0, "Rx PDF file is empty"),
  constructionInfo: FileSchema.optional().nullable(),
  modelTop: FileSchema.optional().nullable(),
  modelBottom: FileSchema.optional().nullable(),
});

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;

// --- ✅ NEW: USER SCHEMA ---
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["customer", "lab", "admin", "milling"]).default("customer"),
  phoneNumber: z.string().optional(),
  
  // Logic: Either clinicId OR newClinicName must be present for doctors
  clinicId: z.string().optional(),
  newClinicName: z.string().optional(),
  
  preferenceNote: z.string().optional(),
  
  address: z.object({
    id: z.string().optional().nullable(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
}).refine(data => {
  if (data.role === 'customer') {
    return !!data.clinicId || !!data.newClinicName;
  }
  return true;
}, {
  message: "Doctors must be assigned to an existing Clinic or a New Clinic.",
  path: ["clinicId"], // Error will appear on this field
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;