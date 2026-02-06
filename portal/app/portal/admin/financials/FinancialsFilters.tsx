// portal/app/portal/admin/financials/FinancialsFilters.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  // ✅ NEW PROPS
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

  // Local state for text inputs to allow typing without instant reload
  const [docInput, setDocInput] = useState(doctorFilter);
  const [clinicInput, setClinicInput] = useState(clinicFilter);

  // Sync state if URL changes externally
  useEffect(() => {
    setDocInput(doctorFilter);
    setClinicInput(clinicFilter);
  }, [doctorFilter, clinicFilter]);

  function update(updates: Record<string, string>) {
    const url = new URL(window.location.href);
    
    Object.entries(updates).forEach(([key, val]) => {
        if (val && val !== "ALL") url.searchParams.set(key, val);
        else url.searchParams.delete(key);
    });
    
    router.replace(url.toString());
  }

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (docInput !== doctorFilter || clinicInput !== clinicFilter) {
            update({ doctor: docInput, clinic: clinicInput });
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [docInput, clinicInput]);

  const hasFilter = designerId || salesRepId || doctorFilter || clinicFilter || selMonth === "ALL" || selYear !== currentYear;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
      {/* Time Window */}
      <div className="flex items-center gap-2">
        <select 
          value={selYear}
          onChange={(e) => update({ year: e.target.value })}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors"
        >
          {years.map(y => <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>)}
        </select>

        <select 
          value={selMonth}
          onChange={(e) => update({ month: e.target.value })}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors"
        >
          <option value="ALL" className="bg-[#1a1a1a]">Full Year</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-[#1a1a1a]">{m}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

      {/* ✅ NEW: Text Filters */}
      <input 
        placeholder="Doctor Name" 
        value={docInput}
        onChange={(e) => setDocInput(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40 focus:border-blue-500/50 transition-colors placeholder-white/30" 
      />
      <input 
        placeholder="Clinic Name" 
        value={clinicInput}
        onChange={(e) => setClinicInput(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40 focus:border-blue-500/50 transition-colors placeholder-white/30" 
      />

      {/* Designer Filter */}
      <select 
        value={designerId}
        onChange={(e) => update({ designer: e.target.value })}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer min-w-[130px] hover:bg-white/5 transition-colors"
      >
        <option value="" className="bg-[#1a1a1a]">All Designers</option>
        {designers.map(d => (
          <option key={d.id} value={d.id} className="bg-[#1a1a1a]">{d.name || d.email}</option>
        ))}
      </select>

      {/* Sales Rep Filter */}
      <select 
        value={salesRepId}
        onChange={(e) => update({ salesRep: e.target.value })}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer min-w-[130px] hover:bg-white/5 transition-colors"
      >
        <option value="" className="bg-[#1a1a1a]">All Sales Reps</option>
        {salesReps.map(r => (
          <option key={r.id} value={r.id} className="bg-[#1a1a1a]">{r.name || r.email}</option>
        ))}
      </select>

      {/* Reset Button */}
      {hasFilter && (
        <button 
          onClick={() => router.replace("/portal/admin/financials")}
          className="text-xs text-white/40 hover:text-white transition px-2 font-medium"
        >
          Reset
        </button>
      )}
    </div>
  );
}