// app/portal/cases/new/page.tsx
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewCaseForm from "@/components/NewCaseForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export type DoctorRow = {
  id: string;
  email: string;
  name: string | null;
  preferenceNote: string | null;          // <--- FETCH
  defaultDesignPreferences: string | null; // <--- FETCH
  clinic: { id: string; name: string };
};

export default async function NewCasePage() {
  const session = await getSession();

  if (!session || (session.role !== "lab" && session.role !== "admin")) {
    return notFound();
  }

  // FIX: Cast the result to DoctorRow[] to satisfy TypeScript
  // We know clinic is not null due to the 'where' clause, but TS needs a nudge.
  const doctors = (await prisma.user.findMany({
    where: { role: "customer", clinicId: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      preferenceNote: true,          // <--- ADDED
      defaultDesignPreferences: true, // <--- ADDED
      clinic: { select: { id: true, name: true } },
    },
    orderBy: [{ clinicId: "asc" }, { email: "asc" }],
  })) as unknown as DoctorRow[];

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-6 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-semibold text-white">New Case</h1>
          <p className="text-white/50 text-sm mt-1">
            Create order and upload scan viewer (Exocad HTML).
          </p>
        </div>
        <Link
          href="/portal/cases"
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-white"
        >
          Cancel
        </Link>
      </div>

      {/* Logic Handover */}
      {doctors.length === 0 ? (
        <div className="flex-1 w-full max-w-5xl mx-auto">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-red-300 font-medium">No doctor accounts found.</p>
              <p className="text-white/40 text-sm mt-2">
                Please create a doctor account first via the Admin Users panel.
              </p>
            </div>
        </div>
      ) : (
        <NewCaseForm doctors={doctors} />
      )}
    </section>
  );
}