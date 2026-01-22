// portal/app/portal/admin/addresses/page.tsx
import { prisma } from "@/lib/prisma";
import AddressListClient from "./AddressListClient";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const total = await prisma.address.count();

  const addresses = await prisma.address.findMany({
    orderBy: { createdAt: "desc" },
    take: 50, // ✅ LIMIT
    include: {
      _count: {
        select: { users: true, clinics: true }
      }
    }
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <AddressListClient addresses={addresses} />

      <div className="flex-none text-center text-xs text-white/30 pt-2 border-t border-white/5">
        {total > addresses.length 
            ? `Showing recent ${addresses.length} of ${total} addresses.` 
            : `Showing all ${addresses.length} addresses.`}
      </div>
    </div>
  );
}