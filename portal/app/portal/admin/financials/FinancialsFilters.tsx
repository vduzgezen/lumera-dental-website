// portal/app/portal/admin/financials/FinancialsFilters.tsx
"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Props = {
  selYear: number;
  selMonth: number | "ALL";
  designerId: string;
  designers: { id: string; name: string | null; email: string }[];
};

export default function FinancialsFilters({ selYear, selMonth, designerId, designers }: Props) {
  const router = useRouter();
  
  const currentYear = new Date().getFullYear();
  // Show Current Year + 2 previous years
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  function update(key: string, val: string) {
    const url = new URL(window.location.href);
    if (val && val !== "ALL") url.searchParams.set(key, val);
    else url.searchParams.delete(key);
    router.replace(url.toString());
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
      {/* Time Window */}
      <div className="flex items-center gap-2">
        <select 
          value={selYear}
          onChange={(e) => update("year", e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors"
        >
          {years.map(y => <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>)}
        </select>

        <select 
          value={selMonth}
          onChange={(e) => update("month", e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors"
        >
          <option value="ALL" className="bg-[#1a1a1a]">Full Year</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-[#1a1a1a]">{m}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Designer Filter */}
      <select 
        value={designerId}
        onChange={(e) => update("designer", e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none cursor-pointer min-w-[200px] hover:bg-white/5 transition-colors"
      >
        <option value="" className="bg-[#1a1a1a]">All Designers (Total Owed)</option>
        {designers.map(d => (
          <option key={d.id} value={d.id} className="bg-[#1a1a1a]">
            {d.name || d.email}
          </option>
        ))}
      </select>

      {/* Reset Button */}
      {(designerId || selMonth === "ALL" || selYear !== currentYear) && (
        <button 
          onClick={() => router.replace("/portal/admin/financials")}
          className="text-xs text-white/40 hover:text-white transition px-2 font-medium"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}