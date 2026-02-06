// portal/app/portal/cases/CasesFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StatusFilter from "@/components/StatusFilter";
import Link from "next/link";

interface Props {
  role: string;
  isAdmin: boolean;
  isDoctor: boolean;
  labUsers: { id: string; name: string | null; email: string }[];
}

export default function CasesFilterBar({ role, isAdmin, isDoctor, labUsers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [filters, setFilters] = useState({
    clinic: searchParams.get("clinic") || "",
    doctor: searchParams.get("doctor") || "",
    assignee: searchParams.get("assignee") || "",
    caseId: searchParams.get("caseId") || "",
    date: searchParams.get("date") || "",
    alias: searchParams.get("alias") || "",
    status: searchParams.getAll("status"),
  });

  // Debounce Timer
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // 1. Handle Instant Updates (Selects & Status)
  const updateInstant = (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setDebouncedFilters(newFilters); // Skip debounce for clicks
  };

  // 2. Handle Text Inputs (Debounced)
  const updateText = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 3. Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // Wait 500ms after typing stops
    return () => clearTimeout(timer);
  }, [filters]);

  // 4. Push to Router when debounced values change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedFilters.clinic) params.set("clinic", debouncedFilters.clinic);
    if (debouncedFilters.doctor) params.set("doctor", debouncedFilters.doctor);
    if (debouncedFilters.assignee) params.set("assignee", debouncedFilters.assignee);
    if (debouncedFilters.caseId) params.set("caseId", debouncedFilters.caseId);
    if (debouncedFilters.date) params.set("date", debouncedFilters.date);
    if (debouncedFilters.alias) params.set("alias", debouncedFilters.alias);
    
    debouncedFilters.status.forEach(s => params.append("status", s));

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedFilters, router]);

  const hasFilters = Object.values(filters).some(v => v && v.length > 0);

  return (
    <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
      
      {/* Status Filter (Auto-Applies) */}
      <StatusFilter 
        selected={filters.status} 
        role={role} 
        onChange={(val) => updateInstant("status", val)} 
      />
      
      <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

      {!isDoctor && (
        <>
          {/* Admin: Lab User Filter */}
          {isAdmin && (
            <select 
                value={filters.assignee}
                onChange={(e) => updateInstant("assignee", e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40 cursor-pointer focus:border-blue-500/50"
            >
                <option value="">All Lab Users</option>
                {labUsers.map(u => (
                    <option key={u.id} value={u.id} className="bg-gray-900">
                        {u.name || u.email}
                    </option>
                ))}
            </select>
          )}

          <input 
            placeholder="Clinic Name" 
            value={filters.clinic}
            onChange={(e) => updateText("clinic", e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40 focus:border-blue-500/50 transition-colors" 
          />
          <input 
            placeholder="Doctor Name" 
            value={filters.doctor}
            onChange={(e) => updateText("doctor", e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 lg:w-40 focus:border-blue-500/50 transition-colors" 
          />
          <input 
            placeholder="Case ID" 
            value={filters.caseId}
            onChange={(e) => updateText("caseId", e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32 font-mono focus:border-blue-500/50 transition-colors" 
          />
          <input 
            type="date" 
            value={filters.date}
            onChange={(e) => updateText("date", e.target.value)} // Date change is usually deliberate, but text-like
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark] focus:border-blue-500/50 transition-colors" 
          />
        </>
      )}
      
      {isDoctor && (
        <input 
            placeholder="Search patient, ID, or name..." 
            value={filters.alias}
            onChange={(e) => updateText("alias", e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white flex-1 min-w-[200px] outline-none focus:border-blue-500/50 transition-colors" 
        />
      )}
      
      {hasFilters && (
         <button 
            onClick={() => {
                setFilters({ clinic:"", doctor:"", assignee:"", caseId:"", date:"", alias:"", status:[] });
                setDebouncedFilters({ clinic:"", doctor:"", assignee:"", caseId:"", date:"", alias:"", status:[] });
            }} 
            className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
         >
            Clear
         </button>
      )}
    </div>
  );
}