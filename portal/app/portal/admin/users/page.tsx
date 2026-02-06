// portal/app/portal/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UserListClient from "./UserListClient";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // 1. Get Totals
  const totalUsers = await prisma.user.count();
  
  // 2. Fetch Users (Explicitly include salesRepId just in case)
  const users = await prisma.user.findMany({ 
    orderBy: { createdAt: "desc" },
    take: 50, 
    include: { 
      clinic: { select: { id: true, name: true } },
      secondaryClinics: { select: { id: true, name: true } },
      address: true,
      // The field 'salesRepId' is a scalar so it's fetched automatically, 
      // but if you want the NAME of the rep in the list later, you'd include:
      // salesRep: { select: { name: true } }
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
      
      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {totalUsers > users.length 
            ? `Showing recent ${users.length} of ${totalUsers} users.` 
            : `Showing all ${users.length} users.`}
      </div>
    </div>
  );
}