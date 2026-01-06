import { prisma } from "@/lib/prisma";
import ClinicListClient from "./ClinicListClient";

export const dynamic = "force-dynamic";

export default async function ClinicsPage() {
  // Fetch clinics + stats
  const clinics = await prisma.clinic.findMany({ 
    orderBy: { name: "asc" },
    include: { 
      _count: { 
        select: { users: true, cases: true } 
      } 
    }
  });
  
  return <ClinicListClient clinics={clinics} />;
}