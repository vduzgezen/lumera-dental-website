// portal/app/portal/cases/milling/finance/MillingFinanceFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MillingFinanceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL or defaults
  const [year, setYear] = useState(searchParams.get("year") || new Date().getFullYear().toString());
  const [month, setMonth] = useState(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  // Debounce Search & Auto-Submit
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month && month !== "ALL") params.set("month", month);
      if (query.trim()) params.set("q", query.trim());
      
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [year, month, query, router]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-surface p-2 rounded-xl border border-border transition-colors">
      
      {/* Year */}
      <select 
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent/50 cursor-pointer hover:bg-[var(--accent-dim)] hover:text-accent transition-colors shadow-sm"
      >
        {years.map(y => <option key={y} value={y} className="bg-surface text-foreground">{y}</option>)}
      </select>

      {/* Month */}
      <select 
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent/50 cursor-pointer hover:bg-[var(--accent-dim)] hover:text-accent transition-colors shadow-sm"
      >
        <option value="ALL" className="bg-surface text-foreground">All Months</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1} className="bg-surface text-foreground">{m}</option>
        ))}
      </select>

      <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Tracking, Clinic, or Batch ID..."
          className="w-full bg-surface-highlight border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 placeholder:text-muted transition-all shadow-sm" 
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Reset Button */}
      {(query || month !== "ALL") && (
        <button 
          onClick={() => { setQuery(""); setMonth("ALL"); }}
          className="text-xs font-bold text-muted bg-surface hover:text-foreground hover:bg-surface-highlight border border-transparent hover:border-border px-3 py-1.5 rounded-md cursor-pointer transition-all shadow-sm"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}