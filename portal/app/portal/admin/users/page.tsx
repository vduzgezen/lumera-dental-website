// portal/app/portal/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UserListClient from "./UserListClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // 1. Get Totals
  const totalUsers = await prisma.user.count();

  // 2. Fetch Users
  const users = await prisma.user.findMany({ 
    orderBy: { createdAt: "desc" },
    take: 50, 
    include: { 
      clinic: { select: { id: true, name: true } },
      secondaryClinics: { select: { id: true, name: true } },
      address: true,
    }
  });

  // 3. Fetch all clinics
  const clinics = await prisma.clinic.findMany({ 
    select: { id: true, name: true }, 
    orderBy: { name: "asc" } 
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <UserListClient users={users} clinics={clinics} />
      
      {/* ✅ FIX: Replaced white/30 with proper theme variables */}
      <div className="flex-none text-center text-xs text-muted pt-2 border-t border-border">
        {totalUsers > users.length 
            ? `Showing recent ${users.length} of ${totalUsers} users.` 
            : `Showing all ${users.length} users.`}
      </div>
    </div>
  );
}