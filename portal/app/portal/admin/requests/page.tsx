// portal/app/portal/admin/requests/page.tsx
import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/AdminTabs";
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
      <div className="flex-none flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white hidden sm:block">Admin</h1>
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <AdminTabs />
      </div>
      
      <RequestListClient requests={requests} />

      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {totalPending > requests.length 
            ? `Showing recent ${requests.length} of ${totalPending} pending requests.` 
            : `Showing all ${requests.length} pending requests.`}
      </div>
    </div>
  );
}