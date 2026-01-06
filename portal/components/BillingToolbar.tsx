// portal/components/BillingToolbar.tsx
"use client";

import Link from "next/link";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Props = {
  selYear: number;
  selMonth: number;
  qFilter: string;
  doctorFilter: string;
  clinicFilter: string;
  isAdminOrLab: boolean;
  isFiltered: boolean;
};

export default function BillingToolbar({
  selYear,
  selMonth,
  qFilter,
  doctorFilter,
  clinicFilter,
  isAdminOrLab,
  isFiltered,
}: Props) {
  // Logic: Start at 2024, end at Current Year (e.g., 2026).
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return (
    <div className="flex-none space-y-4 mb-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Billing & Invoices</h1>
        <p className="text-white/50 text-sm mt-1">
          Manage costs, view history, and track monthly usage.
        </p>
      </header>

      <form className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
        {/* Year Select */}
        <select
          name="year"
          defaultValue={selYear}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none transition appearance-none cursor-pointer hover:bg-white/5"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#1a1a1a]">
              {y}
            </option>
          ))}
        </select>

        {/* Month Select */}
        <select
          name="month"
          defaultValue={selMonth}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none transition appearance-none cursor-pointer hover:bg-white/5"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-[#1a1a1a]">
              {m}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          name="q"
          placeholder="Search Patient or Case ID..."
          defaultValue={qFilter}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-48 transition"
        />

        {/* Admin Filters */}
        {isAdminOrLab && (
          <>
            <input
              name="doctor"
              placeholder="Filter by Doctor..."
              defaultValue={doctorFilter}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-40 transition"
            />
            <input
              name="clinic"
              placeholder="Filter by Clinic..."
              defaultValue={clinicFilter}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none w-40 transition"
            />
          </>
        )}

        <button
          type="submit"
          className="bg-white text-black rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-200 transition"
        >
          Filter
        </button>

        {isFiltered && (
          <Link
            href="/portal/billing"
            className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            Reset
          </Link>
        )}
      </form>
    </div>
  );
}