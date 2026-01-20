// portal/app/portal/admin/requests/page.tsx
import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/AdminTabs";
import RequestListClient from "./RequestListClient";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await prisma.registrationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-none flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white hidden sm:block">Admin</h1>
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <AdminTabs />
      </div>
      
      <RequestListClient requests={requests} />
    </div>
  );
}