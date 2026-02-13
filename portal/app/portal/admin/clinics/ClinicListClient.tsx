// portal/app/portal/admin/clinics/ClinicListClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ClinicForm from "@/components/ClinicForm";
import { AdminTabs } from "@/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClinicListClient({ clinics }: { clinics: any[] }) {
  const router = useRouter();
  const [editingClinic, setEditingClinic] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this clinic? Warning: This will fail if users are linked.")) return;
    const res = await fetch(`/api/clinics/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Failed to delete");
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex-none flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-foreground hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <AdminTabs />
         </div>
        
        <button 
          onClick={() => setIsCreating(true)} 
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/80 transition font-medium"
        >
          + New Clinic
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <th className="p-4 font-medium">Clinic Name</th>
                <th className="p-4 font-medium">City/State</th>
                <th className="p-4 font-medium">Users</th>
                <th className="p-4 font-medium">Cases</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clinics.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--accent-dim)] transition-colors group">
                  <td className="p-4 font-medium text-foreground">{c.name}</td>
                  <td className="p-4 text-muted">
                    {c.address ? `${c.address.city || ''} ${c.address.state || ''}` : "—"}
                  </td>
                  <td className="p-4 text-muted">
                    <span className="bg-surface border border-border px-2 py-0.5 rounded text-xs">
                        {c._count.users}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    <span className="bg-surface border border-border px-2 py-0.5 rounded text-xs">
                        {c._count.cases}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingClinic(c)} className="text-accent hover:text-white transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 transition-colors font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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