// portal/app/portal/cases/milling/MillingFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  uniqueDoctors: string[];
  uniqueZips: string[];
}

export default function MillingFilters({ uniqueDoctors, uniqueZips }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL
  const currentStatuses = new Set(searchParams.getAll("status"));
  const showShipped = searchParams.get("showShipped") === "true";
  const doctorFilter = searchParams.get("doctor") || "ALL";
  const zipFilter = searchParams.get("zip") || "ALL";

  // If no status in URL, default to APPROVED + IN_MILLING (Initial Load)
  if (currentStatuses.size === 0 && !searchParams.has("status")) {
    currentStatuses.add("APPROVED");
    currentStatuses.add("IN_MILLING");
  }

  // Unified Update Function
  const update = useCallback((updates: { 
    status?: Set<string>, 
    showShipped?: boolean, 
    doctor?: string, 
    zip?: string 
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 1. Reset Pagination on any filter change
    params.delete("limit");

    // 2. Handle Status
    if (updates.status !== undefined) {
      params.delete("status");
      updates.status.forEach(s => params.append("status", s));
    }

    // 3. Handle Shipped Toggle
    if (updates.showShipped !== undefined) {
        if (updates.showShipped) params.set("showShipped", "true");
        else params.delete("showShipped");
    }

    // 4. Handle Dropdowns
    if (updates.doctor !== undefined) {
        if (updates.doctor !== "ALL") params.set("doctor", updates.doctor);
        else params.delete("doctor");
    }

    if (updates.zip !== undefined) {
        if (updates.zip !== "ALL") params.set("zip", updates.zip);
        else params.delete("zip");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const toggleStatus = (status: string) => {
    const next = new Set(currentStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    update({ status: next });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
      {/* Status Checkboxes */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={currentStatuses.has("APPROVED")} 
            onChange={() => toggleStatus("APPROVED")} 
            className="accent-emerald-500" 
          />
          Approved
        </label>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={currentStatuses.has("IN_MILLING")} 
            onChange={() => toggleStatus("IN_MILLING")} 
            className="accent-purple-500" 
          />
          In Milling
        </label>
      </div>

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* Doctor Filter */}
      <select
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        value={doctorFilter}
        onChange={(e) => update({ doctor: e.target.value })}
      >
        <option value="ALL">All Doctors</option>
        {(uniqueDoctors || []).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Zip Filter */}
      <select
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        value={zipFilter}
        onChange={(e) => update({ zip: e.target.value })}
      >
        <option value="ALL">All Zip Codes</option>
        {(uniqueZips || []).map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* Show Shipped Toggle */}
      <label className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white cursor-pointer select-none hover:bg-white/5 transition">
        <input 
            type="checkbox" 
            checked={showShipped} 
            onChange={() => update({ showShipped: !showShipped })} 
            className="accent-blue-500" 
        />
        Show Shipped
      </label>

      {/* Clear Button */}
      {(doctorFilter !== "ALL" || zipFilter !== "ALL") && (
        <button
          onClick={() => update({ doctor: "ALL", zip: "ALL" })}
          className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          Clear
        </button>
      )}
    </div>
  );
}