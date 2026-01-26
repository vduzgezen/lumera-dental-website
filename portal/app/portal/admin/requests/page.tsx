// portal/app/portal/admin/requests/page.tsx
import { prisma } from "@/lib/prisma";
import RequestListClient from "./RequestListClient";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const where = { status: "PENDING" };
  
  // 1. Count Pending
  const totalPending = await prisma.registrationRequest.count({ where });
  
  // 2. Fetch Recent Pending
  const requests = await prisma.registrationRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header is now handled inside RequestListClient to match other screens */}
      
      <RequestListClient requests={requests} />

      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {totalPending > requests.length 
            ? `Showing recent ${requests.length} of ${totalPending} pending requests.` 
            : `Showing all ${requests.length} pending requests.`}
      </div>
    </div>
  );
}