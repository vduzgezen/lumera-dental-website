// portal/app/portal/admin/users/new/page.tsx
import { prisma } from "@/lib/prisma";
import NewUserForm from "@/components/NewUserForm";

export default async function NewUserPage() {
  // 1. Fetch data on the Server
  const clinics = await prisma.clinic.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Render the Client Component with data passed as props
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-light text-white mb-8">Add New User</h1>
      <NewUserForm clinics={clinics} />
    </div>
  );
}