// portal/components/BillingList.tsx
"use client";

import { formatCurrency, BillingType } from "@/lib/pricing";

// Define a loose shape for the data passed from the server
type BillingCase = {
  id: string;
  orderDate: Date | string;
  patientAlias: string;
  doctorName: string | null;
  product: string;
  units: number;
  cost: number | string; // Prisma Decimal comes as string or number depending on config
  billingType: string;
  clinic: { name: string };
};

type Props = {
  cases: BillingCase[];
  isAdminOrLab: boolean;
};

export default function BillingList({ cases, isAdminOrLab }: Props) {
  return (
    <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Date</th>
              {isAdminOrLab && <th className="p-4 font-medium">Clinic</th>}
              <th className="p-4 font-medium">Patient</th>
              <th className="p-4 font-medium">Doctor</th>
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium text-center">Units</th>
              <th className="p-4 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdminOrLab ? 7 : 6}
                  className="p-12 text-center text-white/40"
                >
                  No records found matching your filters.
                </td>
              </tr>
            ) : (
              cases.map((c) => {
                const isWarranty = c.billingType === BillingType.WARRANTY;
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white/70">
                      {new Date(c.orderDate).toLocaleDateString()}
                    </td>
                    {isAdminOrLab && (
                      <td className="p-4 text-white/70">{c.clinic.name}</td>
                    )}
                    <td className="p-4 font-medium text-white">
                      {c.patientAlias}
                    </td>
                    <td className="p-4 text-white/60">
                      {c.doctorName || "—"}
                    </td>
                    <td className="p-4 text-white/60">
                      {c.product.replace(/_/g, " ")}
                      {isWarranty && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">
                          Warranty
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-white/60">{c.units}</td>
                    <td
                      className={`p-4 text-right font-mono ${
                        isWarranty
                          ? "text-white/30 decoration-line-through"
                          : "text-emerald-400"
                      }`}
                    >
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
  );
}