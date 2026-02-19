// app/portal/cases/CasesFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StatusFilter from "@/components/StatusFilter";

interface Props {
  role: string;
  isAdmin: boolean;
  isDoctor: boolean;
  labUsers: { id: string; name: string | null; email: string }[];
}

export default function CasesFilterBar({ role, isAdmin, isDoctor, labUsers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    clinic: searchParams.get("clinic") || "",
    doctor: searchParams.get("doctor") || "",
    assignee: searchParams.get("assignee") || "",
    caseId: searchParams.get("caseId") || "",
    date: searchParams.get("date") || "",
    search: searchParams.get("search") || "",
    status: searchParams.getAll("status"),
  });
  
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const canFilterAssignee = isAdmin || role === "lab";

  const updateInstant = (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setDebouncedFilters(newFilters);
  };

  const updateText = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedFilters.clinic) params.set("clinic", debouncedFilters.clinic);
    if (debouncedFilters.doctor) params.set("doctor", debouncedFilters.doctor);
    if (debouncedFilters.assignee) params.set("assignee", debouncedFilters.assignee);
    if (debouncedFilters.caseId) params.set("caseId", debouncedFilters.caseId);
    if (debouncedFilters.date) params.set("date", debouncedFilters.date);
    if (debouncedFilters.search) params.set("search", debouncedFilters.search);
    debouncedFilters.status.forEach(s => params.append("status", s));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedFilters, router]);

  const hasFilters = Object.values(filters).some(v => v && v.length > 0);
  
  const inputClass = "bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted outline-none w-32 lg:w-40 focus:border-accent transition-colors duration-200";

  return (
    <div className="flex flex-wrap gap-2 items-center bg-surface p-2 rounded-xl border border-border transition-colors duration-200">
      
      <StatusFilter 
        selected={filters.status} 
        role={role} 
        onChange={(val) => updateInstant("status", val)} 
      />
      
      <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

      {!isDoctor && (
        <>
          {canFilterAssignee && (
            <select 
                value={filters.assignee}
                onChange={(e) => updateInstant("assignee", e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none w-32 lg:w-40 cursor-pointer focus:border-accent transition-colors duration-200"
            >
                <option value="">All Lab Users</option>
                {labUsers.map(u => (
                    <option key={u.id} value={u.id}>
                        {u.name || u.email}
                    </option>
                ))}
            </select>
          )}

          <input 
            placeholder="Clinic Name" 
            value={filters.clinic}
            onChange={(e) => updateText("clinic", e.target.value)}
            className={inputClass} 
          />
          <input 
            placeholder="Doctor Name" 
            value={filters.doctor}
            onChange={(e) => updateText("doctor", e.target.value)}
            className={inputClass} 
          />
          <input 
            placeholder="Case ID" 
            value={filters.caseId}
            onChange={(e) => updateText("caseId", e.target.value)}
            className={`${inputClass} font-mono`} 
          />
       
          <input 
            type="date" 
            max="2100-12-31"
            value={filters.date}
            onChange={(e) => updateText("date", e.target.value)}
            className={inputClass} 
          />
        </>
      )}
      
      {isDoctor && (
        <input 
            placeholder="Search patient, alias, product..." 
            value={filters.search}
            onChange={(e) => updateText("search", e.target.value)}
            className={`${inputClass} flex-1 min-w-[200px]`} 
        />
      )}
      
      {hasFilters && (
         <button 
            onClick={() => {
              setFilters({ clinic:"", doctor:"", assignee:"", caseId:"", date:"", search:"", status:[] });
              setDebouncedFilters({ clinic:"", doctor:"", assignee:"", caseId:"", date:"", search:"", status:[] });
            }} 
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-[var(--accent-dim)] rounded-lg transition-colors duration-200 cursor-pointer"
         >
            Clear
         </button>
      )}
    </div>
  );
}