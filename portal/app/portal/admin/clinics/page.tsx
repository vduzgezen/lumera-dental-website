// portal/app/portal/admin/clinics/page.tsx
import { prisma } from "@/lib/prisma";
import ClinicListClient from "./ClinicListClient";

export const dynamic = "force-dynamic";

export default async function ClinicsPage() {
  const totalClinics = await prisma.clinic.count();

  const clinics = await prisma.clinic.findMany({ 
    orderBy: { name: "asc" },
    take: 50, // ✅ LIMIT
    include: { 
      address: true,
      _count: { 
        select: { users: true, cases: true } 
      } 
    }
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <ClinicListClient clinics={clinics} />

      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {totalClinics > clinics.length 
            ? `Showing first ${clinics.length} of ${totalClinics} clinics.` 
            : `Showing all ${clinics.length} clinics.`}
      </div>
    </div>
  );
}