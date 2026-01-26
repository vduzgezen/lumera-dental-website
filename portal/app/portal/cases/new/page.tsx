// portal/app/portal/cases/new/page.tsx
import { prisma } from "@/lib/prisma";
import NewCaseForm from "@/components/NewCaseForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const where = session.role === "customer" 
    ? { id: session.userId } 
    : { role: "customer" };

  // ✅ FETCH: Explicitly select secondaryClinics
  const doctors = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      // Primary
      clinic: {
        select: { id: true, name: true, priceTier: true },
      },
      // Secondary (The new relation)
      secondaryClinics: {
        select: { id: true, name: true, priceTier: true },
      },
      preferenceNote: true,
      defaultDesignPreferences: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Create New Case
          </h1>
          <p className="text-white/50 mt-2">
            Enter patient details and select teeth to begin production.
          </p>
        </header>

        <NewCaseForm doctors={doctors as any} />
      </div>
    </div>
  );
}