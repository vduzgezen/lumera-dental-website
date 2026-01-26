// portal/app/portal/cases/MillingDashboard.tsx
"use client";

import { useState, useMemo } from "react";

// ✅ Type Definition (Localized to prevent circular dependency)
export interface CaseRow {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  clinic: { name: string };
  // New Fields
  product: string;
  material: string | null;
  serviceLevel: string | null;
  doctorUser: {
    name: string | null;
    address: {
      zipCode: string | null;
      city: string | null;
      state: string | null;
    } | null;
  } | null;
}

interface MillingDashboardProps {
  cases: CaseRow[];
}

export default function MillingDashboard({ cases }: MillingDashboardProps) {
  // State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [zipFilter, setZipFilter] = useState("ALL");

  // Helper: Format Date
  const fmtDate = (d?: Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  };

  // --- DYNAMIC FILTERS ---
  const uniqueDoctors = useMemo(() => {
    const doctors = new Set(
      cases
        .map(c => c.doctorUser?.name || c.doctorName)
        .filter((name): name is string => !!name)
    );
    return Array.from(doctors).sort();
  }, [cases]);

  const uniqueZips = useMemo(() => {
    const zips = new Set(
      cases
        .map(c => c.doctorUser?.address?.zipCode)
        .filter((zip): zip is string => !!zip)
    );
    return Array.from(zips).sort();
  }, [cases]);

  // --- FILTERING ---
  const filteredCases = cases.filter(c => {
    if (statusFilter !== "ALL") {
       if (statusFilter === "ALLOWED" && c.status !== "APPROVED") return false;
       if (statusFilter === "IN_MILLING" && c.status !== "IN_MILLING") return false;
    }
    if (doctorFilter !== "ALL") {
      const docName = c.doctorUser?.name || c.doctorName;
      if (docName !== doctorFilter) return false;
    }
    if (zipFilter !== "ALL") {
      const zip = c.doctorUser?.address?.zipCode;
      if (zip !== zipFilter) return false;
    }
    return true;
  });

  return (
    <section className="flex flex-col h-full w-full p-6 overflow-hidden">
      
      {/* HEADER & FILTERS */}
      <div className="flex-none space-y-4 mb-4">
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
             <h1 className="text-2xl font-semibold text-white">Milling Dashboard</h1>
             <span className="text-sm text-white/40">Queue: {filteredCases.length}</span>
          </div>
        </header>

        {/* Filter Bar - Matches CasesPage Aesthetics */}
        <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
          <select 
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ALLOWED">Allowed (Ready)</option>
            <option value="IN_MILLING">In Milling</option>
          </select>

          <select 
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="ALL">All Doctors</option>
            {uniqueDoctors.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select 
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            value={zipFilter}
            onChange={(e) => setZipFilter(e.target.value)}
          >
            <option value="ALL">All Zip Codes</option>
            {uniqueZips.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          {(statusFilter !== "ALL" || doctorFilter !== "ALL" || zipFilter !== "ALL") && (
            <button 
              onClick={() => { setStatusFilter("ALL"); setDoctorFilter("ALL"); setZipFilter("ALL"); }}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER - Exact match to CasesPage layout */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">Case ID</th>
                <th className="p-4 font-medium">Doctor</th>
                <th className="p-4 font-medium">Zip Code</th>
                <th className="p-4 font-medium">Product Details</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  {/* ID (Non-clickable) */}
                  <td className="p-4 font-mono text-blue-400 select-all">
                    #{c.id.slice(-6)}
                  </td>
                  
                  {/* Doctor */}
                  <td className="p-4 font-medium text-white">
                    {c.doctorUser?.name || c.doctorName || <span className="text-white/30 italic">Unknown</span>}
                  </td>

                  {/* Zip Code */}
                  <td className="p-4 text-white/70 font-mono">
                     {c.doctorUser?.address?.zipCode || <span className="text-white/30">-</span>}
                  </td>

                  {/* Product */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{c.product}</span>
                      <span className="text-xs text-white/50">
                        {c.material ? `${c.material} • ` : ""}
                        {c.serviceLevel?.replace(/_/g, " ") || "Standard"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-semibold tracking-wide border
                       ${c.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         c.status === 'IN_MILLING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                         'bg-white/5 text-white/50 border-white/10'}`}>
                       {c.status.replace(/_/g, " ")}
                     </span>
                  </td>

                  {/* Date */}
                  <td className="p-4 text-white/50">
                     {fmtDate(c.dueDate)}
                  </td>
                </tr>
              ))}
              
              {/* Empty State */}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-white/40">
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="flex-none p-2 border-t border-white/5 bg-white/[0.02] text-center text-xs text-white/30">
          Showing {filteredCases.length} production cases.
        </div>
      </div>
    </section>
  );
}