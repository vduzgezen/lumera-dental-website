// portal/app/portal/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UserListClient from "./UserListClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // 1. Get Totals
  const totalUsers = await prisma.user.count();

  // 2. Fetch recent Users (Limit 50)
  const users = await prisma.user.findMany({ 
    orderBy: { createdAt: "desc" },
    take: 50, // ✅ LIMIT
    include: { 
      clinic: { select: { id: true, name: true } },
      address: true 
    }
  });

  // 3. Fetch all clinics (Dropdowns need all options, usually acceptable if <500)
  // If clinics grow >500, we should convert the dropdown to a search-as-you-type.
  const clinics = await prisma.clinic.findMany({ 
    select: { id: true, name: true }, 
    orderBy: { name: "asc" } 
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <UserListClient users={users} clinics={clinics} />
      
      {/* Footer Info */}
      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {totalUsers > users.length 
            ? `Showing recent ${users.length} of ${totalUsers} users.` 
            : `Showing all ${users.length} users.`}
      </div>
    </div>
  );
}