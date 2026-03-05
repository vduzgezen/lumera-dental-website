// app/portal/cases/CasesFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import StatusFilter from "./StatusFilter";
import TriageBar from "./TriageBar";

interface Props {
  role: string;
  isAdmin: boolean;
  isDoctor: boolean;
  labUsers: { id: string; name: string | null; email: string }[];
  canCreate?: boolean;
  availableClinics?: { id: string; name: string }[];
  activeClinicId?: string;
  activeClinicName?: string;
  totalCount?: number;
  actionCount?: number;
  unreadCount?: number;
  shippedCount?: number;
}

export default function CasesFilterBar({ 
  role, 
  isAdmin, 
  isDoctor, 
  labUsers,
  canCreate,
  availableClinics = [],
  activeClinicId = "",
  activeClinicName = "",
  totalCount = 0,
  actionCount = 0,
  unreadCount = 0,
  shippedCount = 0
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    clinic: activeClinicId || searchParams.get("clinic") || "", // ✅ Hydrate with active
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
    // ✅ Sync the global cookie immediately on clinic change
    if (key === "clinic" && typeof value === "string") {
      document.cookie = `lumera_active_clinic=${value}; path=/; max-age=31536000; SameSite=Lax`;
    }
    
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

  const displayClinicName = availableClinics.find(c => c.id === filters.clinic)?.name || activeClinicName || "";

  return (
    <div className="flex-none w-full mb-4">
      
      <header className="flex items-center justify-between h-24 border-b border-transparent">
         
         <div className="flex items-center gap-3">
           <div className="relative inline-block">
             {isDoctor && availableClinics.length > 1 ? (
               <div className="relative inline-flex items-center gap-2 group cursor-pointer">
                 <span className="font-medium text-4xl text-foreground group-hover:text-[var(--accent)] transition-colors tracking-tight">
                   {displayClinicName} Cases
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
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
             ) : (
               <h1 className="text-4xl font-medium text-foreground tracking-tight">
                 {displayClinicName ? `${displayClinicName} Cases` : 'Cases'}
               </h1>
             )}
           </div>
           
           <span className="text-muted text-lg tracking-tight mt-1">
             ({totalCount} Total)
           </span>
         </div>
         
         <div className="flex items-center gap-6">
            <TriageBar 
              actionCount={actionCount!} 
              unreadCount={unreadCount!} 
              shippedCount={shippedCount!} 
              isDoctor={isDoctor} 
            />
            {canCreate && (
              <Link
                href="/portal/cases/new"
                className="px-4 py-2 rounded-xl bg-surface text-foreground text-sm font-semibold hover:brightness-110 hover:scale-105 transition-all shadow-md border border-border whitespace-nowrap"
              >
                + New Case
              </Link>
            )}
         </div>
      </header>

      <div className="pt-4">
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
                        <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                </select>
              )}

              <input placeholder="Clinic Name" value={filters.clinic} onChange={(e) => updateText("clinic", e.target.value)} className={inputClass} />
              <input placeholder="Doctor Name" value={filters.doctor} onChange={(e) => updateText("doctor", e.target.value)} className={inputClass} />
              <input placeholder="Case ID" value={filters.caseId} onChange={(e) => updateText("caseId", e.target.value)} className={`${inputClass} font-mono`} />
              <input type="date" max="2100-12-31" value={filters.date} onChange={(e) => updateText("date", e.target.value)} className={inputClass} />
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
                  // ✅ Don't wipe the clinic filter on clear!
                  setFilters(prev => ({ ...prev, doctor:"", assignee:"", caseId:"", date:"", search:"", status:[] }));
                  setDebouncedFilters(prev => ({ ...prev, doctor:"", assignee:"", caseId:"", date:"", search:"", status:[] }));
                }} 
                className="px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-[var(--accent-dim)] rounded-lg transition-colors duration-200 cursor-pointer"
             >
                Clear
             </button>
          )}
        </div>
      </div>

    </div>
  );
}