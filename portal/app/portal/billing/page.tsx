// portal/app/portal/billing/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, BillingType } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Determine filtering based on role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};
  
  if (session.role === "customer") {
    if (!session.clinicId) {
      return (
        <div className="p-8 text-white/50">
          Your account is not linked to a clinic. Please contact support.
        </div>
      );
    }
    whereClause.clinicId = session.clinicId;
  } else {
    // Lab/Admin sees ALL cases by default
  }

  // Calculate Date Range (Current Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Filter by Order Date within this month
  whereClause.orderDate = {
    gte: startOfMonth,
    lte: endOfMonth,
  };

  const cases = await prisma.dentalCase.findMany({
    where: whereClause,
    orderBy: { orderDate: "desc" },
    select: {
      id: true,
      orderDate: true,
      patientAlias: true,
      doctorName: true,
      product: true,
      units: true,
      cost: true,
      billingType: true,
    },
  });

  // Calculate Totals
  // FIX: Explicitly typed 'sum' and 'c' to resolve TS7006 (implicit any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCost = cases.reduce((sum: number, c: any) => sum + Number(c.cost), 0);
  const caseCount = cases.length;

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden">
      <header className="flex-none mb-6">
        <h1 className="text-2xl font-semibold text-white">Monthly Billing</h1>
        <p className="text-white/50 text-sm mt-1">
          {startOfMonth.toLocaleDateString()} — {endOfMonth.toLocaleDateString()}
        </p>
      </header>

      {/* Summary Cards */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-sm text-white/50 mb-1">Current Month Total</div>
          <div className="text-4xl font-light text-accent">
            {formatCurrency(totalCost)}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-sm text-white/50 mb-1">Cases Processed</div>
          <div className="text-4xl font-light text-white">
            {caseCount}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Patient</th>
                <th className="p-4 font-medium">Doctor</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cases.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-white/40">
                     No cases found for this month.
                   </td>
                 </tr>
              ) : (
                // FIX: Explicitly typed 'c' as any to resolve TS7006
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cases.map((c: any) => {
                  const isWarranty = c.billingType === BillingType.WARRANTY;
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white/70">
                        {new Date(c.orderDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {c.patientAlias}
                      </td>
                      <td className="p-4 text-white/60">
                        {c.doctorName || "—"}
                      </td>
                      <td className="p-4 text-white/60">
                        <div className="flex items-center gap-2">
                          <span>
                            {c.units} unit{c.units !== 1 ? 's' : ''} • {c.product.replace(/_/g, " ")}
                          </span>
                          {isWarranty && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">
                              Warranty
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono ${isWarranty ? "text-white/30 decoration-line-through" : "text-emerald-400"}`}>
                        {formatCurrency(Number(c.cost))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}