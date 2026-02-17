// app/portal/cases/types.ts
export type CaseRow = {
  id: string;
  patientAlias: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  clinic: { 
    name: string; 
    phone: string | null;
  };
  assigneeUser: { name: string | null; email: string } | null;
  product: string;
  material: string | null;
  serviceLevel: string | null;
  doctorUser: {
    name: string | null;
    phoneNumber: string | null;
    address: {
      street: string | null;
      zipCode: string | null;
      city: string | null;
      state: string | null;
    } | null;
  } | null;
};