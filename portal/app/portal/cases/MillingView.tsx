// app/portal/cases/MillingView.tsx
import { prisma } from "@/lib/prisma";
import MillingDashboard from "./milling/MillingDashboard";
import AutoRefresh from "@/components/AutoRefresh";

export default async function MillingView({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[] | undefined> 
}) {
  // Helpers (Local to this view)
  const getParam = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const getParamArray = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
  };

  const limitParam = getParam("limit");
  const limit = limitParam ? parseInt(limitParam) : 50;

  const statusParams = getParamArray("status");
  const showShipped = getParam("showShipped") === "true";
  const doctorParam = getParam("doctor");
  const zipParam = getParam("zip");

  const whereMilling: any = {
      stage: { in: ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED", "DELIVERED"] }
  };

  let targetStatuses: string[] = [];
  if (statusParams.length > 0) {
      targetStatuses = [...statusParams];
  } else {
      targetStatuses = ["APPROVED", "IN_MILLING"];
  }

  if (showShipped && !targetStatuses.includes("SHIPPED")) {
      targetStatuses.push("SHIPPED");
  }

  whereMilling.status = { in: targetStatuses };

  if (doctorParam && doctorParam !== "ALL") {
      whereMilling.OR = [
          { doctorName: doctorParam },
          { doctorUser: { name: doctorParam } }
      ];
  }

  if (zipParam && zipParam !== "ALL") {
      whereMilling.doctorUser = { address: { zipCode: zipParam } };
  }

  const [totalMillingCount, millingCases, distinctDoctors, distinctZips] = await Promise.all([
      prisma.dentalCase.count({ where: whereMilling }),
      prisma.dentalCase.findMany({
          where: whereMilling,
          orderBy: { dueDate: "asc" },
          take: limit, 
          select: {
              id: true, patientAlias: true, patientFirstName: true, patientLastName: true, 
              toothCodes: true, status: true, dueDate: true, product: true, shade: true,
              updatedAt: true, createdAt: true, material: true, serviceLevel: true,
              doctorName: true, 
              clinic: { select: { name: true, phone: true } }, 
              assigneeUser: { select: { name: true, email: true } }, 
              doctorUser: { 
                  select: { 
                      name: true, 
                      phoneNumber: true, 
                      address: { select: { street: true, zipCode: true, city: true, state: true } } 
                  } 
              }
          }
      }),
      prisma.dentalCase.findMany({
          where: { stage: { in: ["MILLING_GLAZING", "SHIPPING", "COMPLETED"] } },
          distinct: ['doctorName'],
          select: { doctorName: true, doctorUser: { select: { name: true } } }
      }),
      prisma.dentalCase.findMany({
          where: { stage: { in: ["MILLING_GLAZING", "SHIPPING", "COMPLETED"] } },
          distinct: ['doctorUserId'],
          select: { doctorUser: { select: { address: { select: { zipCode: true } } } } }
      })
  ]);

  const uniqueDoctors = Array.from(new Set(
      distinctDoctors.map((c: { doctorUser: { name: string | null } | null; doctorName: string | null }) => 
        c.doctorUser?.name || c.doctorName
      ).filter(Boolean) as string[]
  )).sort();

  const uniqueZips = Array.from(new Set(
      distinctZips.map((c: { doctorUser: { address: { zipCode: string | null } | null } | null }) => 
        c.doctorUser?.address?.zipCode
      ).filter(Boolean) as string[]
  )).sort();

  const safeMillingCases = millingCases.map((c: any) => ({ 
      ...c, 
      dueDate: c.dueDate ? c.dueDate : null 
  })) as unknown as any[];

  return (
      <div className="flex flex-col h-full overflow-hidden bg-background text-foreground">
          <AutoRefresh intervalMs={60000} />
          <MillingDashboard 
              cases={safeMillingCases} 
              totalCount={totalMillingCount}
              uniqueDoctors={uniqueDoctors}
              uniqueZips={uniqueZips}
          />
      </div>
  );
}