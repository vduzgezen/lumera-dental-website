// portal/components/BillingToolbar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for debouncing
  const [filters, setFilters] = useState({
    year: selYear,
    month: selMonth,
    q: qFilter,
    doctor: doctorFilter,
    clinic: clinicFilter,
  });

  // Sync state if parent props change (e.g. via Reset link)
  useEffect(() => {
    setFilters({
      year: selYear,
      month: selMonth,
      q: qFilter,
      doctor: doctorFilter,
      clinic: clinicFilter,
    });
  }, [selYear, selMonth, qFilter, doctorFilter, clinicFilter]);

  // Debounced URL Update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      
      params.set("year", String(filters.year));
      params.set("month", String(filters.month));
      
      if (filters.q) params.set("q", filters.q);
      if (filters.doctor) params.set("doctor", filters.doctor);
      if (filters.clinic) params.set("clinic", filters.clinic);

      router.replace(`?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [filters, router]);

  // Handle Immediate Changes (Selects)
  const updateInstant = (key: string, val: string | number) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  // Logic: Start at 2024, end at Current Year
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return (
    <div className="flex-none space-y-4 mb-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Billing & Invoices</h1>
        <p className="text-muted text-sm mt-1">
          Manage costs, view history, and track monthly usage.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 items-center bg-surface p-2 rounded-xl border border-border">
        {/* Year Select */}
        <select
          value={filters.year}
          onChange={(e) => updateInstant("year", Number(e.target.value))}
          className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 outline-none transition appearance-none cursor-pointer hover:bg-[var(--accent-dim)]"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-surface">
              {y}
            </option>
          ))}
        </select>

        {/* Month Select */}
        <select
          value={filters.month}
          onChange={(e) => updateInstant("month", Number(e.target.value))}
          className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 outline-none transition appearance-none cursor-pointer hover:bg-[var(--accent-dim)]"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-surface">
              {m}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          value={filters.q}
          onChange={(e) => updateInstant("q", e.target.value)}
          placeholder="Search Patient or Case ID..."
          className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-accent/50 outline-none w-48 transition"
        />

        {/* Admin Filters */}
        {isAdminOrLab && (
          <>
            <input
              value={filters.doctor}
              onChange={(e) => updateInstant("doctor", e.target.value)}
              placeholder="Filter by Doctor..."
              className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-accent/50 outline-none w-40 transition"
            />
            <input
              value={filters.clinic}
              onChange={(e) => updateInstant("clinic", e.target.value)}
              placeholder="Filter by Clinic..."
              className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-accent/50 outline-none w-40 transition"
            />
          </>
        )}

        {isFiltered && (
          <Link
            href="/portal/billing"
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-[var(--accent-dim)] rounded-lg transition"
          >
            Reset
          </Link>
        )}
      </div>
    </div>
  );
}
