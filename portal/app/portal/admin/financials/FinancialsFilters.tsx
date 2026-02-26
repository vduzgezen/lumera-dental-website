// portal/app/portal/admin/financials/FinancialsFilters.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Props = {
  selYear: number;
  selMonth: number | "ALL";
  designerId: string;
  designers: { id: string; name: string | null; email: string }[];
  salesRepId: string;
  salesReps: { id: string; name: string | null; email: string }[];
  doctorFilter: string;
  clinicFilter: string;
};

export default function FinancialsFilters({ 
  selYear, selMonth, 
  designerId, designers, 
  salesRepId, salesReps,
  doctorFilter, clinicFilter
}: Props) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const [docInput, setDocInput] = useState(doctorFilter);
  const [clinicInput, setClinicInput] = useState(clinicFilter);

  useEffect(() => {
    setDocInput(doctorFilter);
    setClinicInput(clinicFilter);
  }, [doctorFilter, clinicFilter]);

  const update = useCallback((updates: Record<string, string>) => {
    const url = new URL(window.location.href);
    
    // 1. Reset pagination limit whenever a filter changes
    url.searchParams.delete("limit");

    // 2. Update Params
    Object.entries(updates).forEach(([key, val]) => {
        if (val) {
            url.searchParams.set(key, val);
        } else {
            url.searchParams.delete(key);
        }
    });
    router.replace(url.toString());
  }, [router]);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (docInput !== doctorFilter || clinicInput !== clinicFilter) {
            update({ doctor: docInput, clinic: clinicInput });
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [docInput, clinicInput, doctorFilter, clinicFilter, update]);

  const hasFilter = designerId || salesRepId || doctorFilter || clinicFilter || selMonth === "ALL" || selYear !== currentYear;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-surface p-2 rounded-xl border border-border shadow-sm transition-colors">
      {/* Time Window */}
      <div className="flex items-center gap-2">
        <select 
          value={selYear}
          onChange={(e) => update({ year: e.target.value })}
          className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none cursor-pointer hover:bg-[var(--accent-dim)] transition-colors shadow-sm"
        >
          {years.map(y => <option key={y} value={y} className="bg-surface text-foreground">{y}</option>)}
        </select>

        <select 
          value={selMonth}
          onChange={(e) => update({ month: e.target.value })}
          className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none cursor-pointer hover:bg-[var(--accent-dim)] transition-colors shadow-sm"
        >
          <option value="ALL" className="bg-surface text-foreground">Full Year</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-surface text-foreground">{m}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

      {/* Text Filters */}
      <input 
        placeholder="Doctor Name" 
        value={docInput}
        onChange={(e) => setDocInput(e.target.value)}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none w-32 lg:w-40 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors placeholder-muted shadow-sm" 
      />
      <input 
        placeholder="Clinic Name" 
        value={clinicInput}
        onChange={(e) => setClinicInput(e.target.value)}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none w-32 lg:w-40 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors placeholder-muted shadow-sm" 
      />

      {/* Designer Filter */}
      <select 
        value={designerId}
        onChange={(e) => update({ designer: e.target.value })}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none cursor-pointer min-w-[130px] hover:bg-[var(--accent-dim)] transition-colors shadow-sm"
      >
        <option value="" className="bg-surface text-foreground">All Designers</option>
        {designers.map(d => (
          <option key={d.id} value={d.id} className="bg-surface text-foreground">{d.name || d.email}</option>
        ))}
      </select>

      {/* Sales Rep Filter */}
      <select 
        value={salesRepId}
        onChange={(e) => update({ salesRep: e.target.value })}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none cursor-pointer min-w-[130px] hover:bg-[var(--accent-dim)] transition-colors shadow-sm"
      >
        <option value="" className="bg-surface text-foreground">All Sales Reps</option>
        {salesReps.map(r => (
          <option key={r.id} value={r.id} className="bg-surface text-foreground">{r.name || r.email}</option>
        ))}
      </select>

      {/* Reset Button */}
      {hasFilter && (
        <button 
          onClick={() => router.replace("/portal/admin/financials")}
          className="text-xs font-bold text-muted bg-surface hover:text-foreground hover:bg-[var(--accent-dim)] border border-transparent hover:border-border px-3 py-1.5 rounded-md cursor-pointer transition-all shadow-sm"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}