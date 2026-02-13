// portal/app/portal/admin/addresses/AddressListClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTabs } from "@/components/AdminTabs";

export default function AddressListClient({ addresses }: { addresses: any[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  
  async function deleteAddr(id: string, usageCount: number) {
    const confirmMsg = usageCount > 0 
      ? `This address is linked to ${usageCount} users/clinics. Delete anyway?`
      : "Delete this address?";
    if (!confirm(confirmMsg)) return;

    setBusyId(id);
    try {
        const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
        if (res.ok) router.refresh();
        else alert("Failed to delete");
    } catch (e: any) {
        alert("Network error: " + e.message);
    } finally {
        setBusyId(null);
    }
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
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <th className="p-4 font-medium">Street</th>
                <th className="p-4 font-medium">City/State</th>
                <th className="p-4 font-medium">Linked To</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {addresses.map((a) => {
                const usage = a._count.users + a._count.clinics;
                const isBusy = busyId === a.id;
                return (
                  <tr key={a.id} className="hover:bg-[var(--accent-dim)] transition-colors group">
                    <td className="p-4 font-medium text-foreground">{a.street || "—"}</td>
                    <td className="p-4 text-muted">{a.city}, {a.state} {a.zipCode}</td>
                    <td className="p-4 text-muted">
                      {usage > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 font-medium">
                              {usage} Links
                          </span>
                      ) : (
                          <span className="text-muted/50 italic text-xs">Unused</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                          onClick={() => deleteAddr(a.id, usage)} 
                          disabled={isBusy}
                          className="text-red-400 hover:text-red-300 transition-colors font-medium opacity-60 group-hover:opacity-100 disabled:opacity-30"
                      >
                          {isBusy ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}