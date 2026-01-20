// portal/app/portal/admin/addresses/page.tsx
import { prisma } from "@/lib/prisma";
import AddressListClient from "./AddressListClient";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const addresses = await prisma.address.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, clinics: true }
      }
    }
  });

  return <AddressListClient addresses={addresses} />;
}