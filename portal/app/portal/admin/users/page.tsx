//portal/app/portal/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UserListClient from "./UserListClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // Fetch users with their clinic name
  const users = await prisma.user.findMany({ 
    orderBy: { createdAt: "desc" },
    include: { clinic: { select: { id: true, name: true } } }
  });
  
  // Fetch clinics for the dropdown
  const clinics = await prisma.clinic.findMany({ 
    select: { id: true, name: true }, 
    orderBy: { name: "asc" } 
  });

  return <UserListClient users={users} clinics={clinics} />;
}