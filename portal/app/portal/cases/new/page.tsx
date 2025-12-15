// app/portal/cases/new/page.tsx
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewCaseForm from "@/components/NewCaseForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DoctorRow = {
  id: string;
  email: string;
  name: string | null;
  clinic: { id: string; name: string };
};

export default async function NewCasePage() {
  const session = await getSession();
  if (!session || (session.role !== "lab" && session.role !== "admin")) {
    return notFound();
  }

  const doctors: DoctorRow[] = await prisma.user.findMany({
    where: { role: "customer", clinicId: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      clinic: { select: { id: true, name: true } },
    },
    orderBy: [{ clinicId: "asc" }, { email: "asc" }],
  });

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Case</h1>
        <Link href="/portal/cases" className="text-white/80 underline">
          ← Back to Cases
        </Link>
      </header>

      {doctors.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-amber-300">
            No doctor accounts found. Create one first (Admin → New Doctor).
          </p>
          <p className="text-white/60 text-sm mt-2">
            <code>/portal/admin/users/new</code>
          </p>
        </div>
      ) : (
        <NewCaseForm doctors={doctors} />
      )}

      <p className="text-white/60 text-sm">
        Initial status: <b>IN_DESIGN</b>, stage <b>DESIGN</b>. Due date = order date + 8 days.
      </p>
    </section>
  );
}
