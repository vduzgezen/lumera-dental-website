//portal/app/portal/admin/clinics/ClinicListClient.tsx
"use client";
import { useState } from "react";
import ClinicForm from "@/components/ClinicForm";
import { AdminTabs } from "@/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClinicListClient({ clinics }: { clinics: any[] }) {
  const [editingClinic, setEditingClinic] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. COMPRESSED HEADER: Matches UserListClient exactly */}
      <div className="flex-none flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <AdminTabs />
         </div>
         <button 
          onClick={() => setIsCreating(true)} 
          className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-white/5"
        >
          + Add Clinic
        </button>
      </div>

      {/* 2. CONSISTENT LIST STYLING: bg-black/20 container, bg-black/40 header */}
      <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-white/10 bg-black/20 shadow-2xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="p-4 font-medium">Clinic Name</th>
              <th className="p-4 font-medium">City/State</th>
              <th className="p-4 font-medium">Users</th>
              <th className="p-4 font-medium">Cases</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clinics.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{c.name}</td>
                <td className="p-4 text-white/60">
                  {c.city && c.state ? `${c.city}, ${c.state}` : "—"}
                </td>
                <td className="p-4 text-white/60">{c._count.users}</td>
                <td className="p-4 text-white/60">{c._count.cases}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setEditingClinic(c)} 
                    className="text-accent hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isCreating || editingClinic) && (
        <ClinicForm 
          initialData={editingClinic}
          onClose={() => { setEditingClinic(null); setIsCreating(false); }}
        />
      )}
    </div>
  );
}