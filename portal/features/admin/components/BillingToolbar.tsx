// features/admin/components/BillingToolbar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import BillingPayButton from "./BillingPayButton";

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
  personalFilter: boolean;
  availableClinics: { id: string; name: string }[];
  isAdminOrLab: boolean;
  showClinicFilter: boolean;
  isFiltered: boolean;
  showPayButton?: boolean;
  activeClinicId?: string | null;
  activeClinicName?: string;
  totalOwed?: number;
  sessionRole?: string;
};

export default function BillingToolbar({
  selYear,
  selMonth,
  qFilter,
  doctorFilter,
  clinicFilter,
  personalFilter,
  availableClinics,
  isAdminOrLab,
  showClinicFilter,
  isFiltered,
  showPayButton,
  activeClinicId,
  activeClinicName,
  totalOwed,
  sessionRole,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    year: selYear,
    month: selMonth,
    q: qFilter,
    doctor: doctorFilter,
    clinic: activeClinicId || clinicFilter,
    personal: personalFilter,
  });

  useEffect(() => {
    setFilters({
      year: selYear,
      month: selMonth,
      q: qFilter,
      doctor: doctorFilter,
      clinic: activeClinicId || clinicFilter,
      personal: personalFilter,
    });
  }, [selYear, selMonth, qFilter, doctorFilter, clinicFilter, personalFilter, activeClinicId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      
      params.set("year", String(filters.year));
      params.set("month", String(filters.month));
      
      if (filters.q) params.set("q", filters.q);
      if (filters.doctor) params.set("doctor", filters.doctor);
      if (filters.clinic) params.set("clinic", filters.clinic);
      if (filters.personal) params.set("personal", "true");

      router.replace(`?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [filters, router]);

  const updateInstant = (key: string, val: string | number | boolean) => {
    if (key === "clinic" && typeof val === "string") {
      document.cookie = `lumera_active_clinic=${val}; path=/; max-age=31536000; SameSite=Lax`;
    }

    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const displayClinicName = availableClinics.find(c => c.id === filters.clinic)?.name || activeClinicName || "";

  return (
    <div className="flex-none w-full pb-3">
      
      {/* HEADER ROW */}
      <header className="flex items-center justify-between h-24 border-b border-transparent">
        {/* ✅ Wrapper changed to relative flex items-center so the title strictly centers within h-24 */}
        <div className="relative flex items-center">
          <div className="relative inline-block">
             {sessionRole === "customer" && availableClinics.length > 1 ? (
               <div className="relative inline-flex items-center gap-2 group cursor-pointer">
                 <span className="font-medium text-4xl text-foreground group-hover:text-[var(--accent)] transition-colors tracking-tight">
                   {displayClinicName} Billing & Invoices
                 </span>
                 <svg className="w-8 h-8 text-muted group-hover:text-[var(--accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                 </svg>
                 
                 <select 
                   value={filters.clinic}
                   onChange={(e) => updateInstant("clinic", e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 >
                   {availableClinics.map(c => (
                     <option key={c.id} value={c.id}>
                       {c.name}
                     </option>
                   ))}
                 </select>
               </div>
             ) : (
               <h1 className="font-medium text-4xl text-foreground tracking-tight">
                 {displayClinicName ? `${displayClinicName} Billing & Invoices` : 'Billing & Invoices'}
               </h1>
             )}
          </div>
          {/* ✅ Subtitle is absolutely positioned underneath so it doesn't shift the title up */}
          <p className="absolute top-[100%] left-0 text-muted text-sm whitespace-nowrap mt-1 pointer-events-none">
            Manage costs, view history, and track monthly usage.
          </p>
        </div>
        
        {showPayButton && activeClinicId && totalOwed !== undefined && totalOwed > 0 && (
          <BillingPayButton 
            clinicId={activeClinicId} 
            amount={totalOwed} 
            month={selMonth} 
            year={selYear} 
          />
        )}
      </header>

      {/* FILTERS ROW */}
      <div className="pt-4">
        <div className="flex flex-wrap gap-2 items-center bg-surface p-2 rounded-xl border border-border">
          
          <div className="relative flex items-center">
            <select
              value={filters.year}
              onChange={(e) => updateInstant("year", Number(e.target.value))}
              className="bg-surface-highlight border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-foreground focus:border-[var(--accent)]/50 outline-none transition appearance-none cursor-pointer hover:bg-[var(--accent-dim)]"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-surface">{y}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-muted absolute right-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="relative flex items-center">
            <select
              value={filters.month}
              onChange={(e) => updateInstant("month", Number(e.target.value))}
              className="bg-surface-highlight border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-foreground focus:border-[var(--accent)]/50 outline-none transition appearance-none cursor-pointer hover:bg-[var(--accent-dim)]"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1} className="bg-surface">{m}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-muted absolute right-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <input
            value={filters.q}
            onChange={(e) => updateInstant("q", e.target.value)}
            placeholder="Search Patient or Case ID..."
            className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-[var(--accent)]/50 outline-none w-48 transition"
          />

          {isAdminOrLab && (
            <input
              value={filters.doctor}
              onChange={(e) => updateInstant("doctor", e.target.value)}
              placeholder="Filter by Doctor..."
              className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-[var(--accent)]/50 outline-none w-40 transition"
            />
          )}
          
          {showClinicFilter && (
            <div className="relative flex items-center">
              <select
                value={filters.clinic}
                onChange={(e) => updateInstant("clinic", e.target.value)}
                className="bg-surface-highlight border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-foreground focus:border-[var(--accent)]/50 outline-none transition appearance-none cursor-pointer hover:bg-[var(--accent-dim)] max-w-[200px] truncate"
              >
                <option value="">All Clinics</option>
                {availableClinics.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface">
                    {c.name}
                  </option>
                ))}
              </select>
              <svg className="w-4 h-4 text-muted absolute right-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

          {sessionRole === "customer" && (
             <label className="flex items-center gap-2 text-sm text-foreground bg-surface-highlight border border-border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--accent-dim)] transition-colors ml-auto">
               <input 
                 type="checkbox" 
                 checked={filters.personal} 
                 onChange={(e) => updateInstant("personal", e.target.checked)} 
                 className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer" 
               />
               Show my cases only
             </label>
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
    </div>
  );
}