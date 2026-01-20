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
      ? `This address is currently linked to ${usageCount} users/clinics.\n\nDeleting it will REMOVE it from their profiles, requiring them to enter it again.\n\nProceed?`
      : "Delete this address?";

    if (!confirm(confirmMsg)) return;

    setBusyId(id);
    try {
        const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
        
        if (res.ok) {
            router.refresh();
        } else {
            // FIX: Read text first to handle HTML errors (404/500)
            const text = await res.text();
            try {
                const j = JSON.parse(text);
                alert(j.error || "Failed to delete");
            } catch {
                console.error("API Error:", res.status, text);
                alert(`Server returned ${res.status} ${res.statusText}. Check console for details.`);
            }
        }
    } catch (e: any) {
        console.error("Network Error:", e);
        alert("Network error: " + e.message);
    } finally {
        setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-none flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white hidden sm:block">Admin</h1>
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <AdminTabs />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-white/10 bg-black/20 shadow-2xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="p-4 font-medium">Street</th>
              <th className="p-4 font-medium">City/State</th>
              <th className="p-4 font-medium">Linked To</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {addresses.map((a) => {
              const usage = a._count.users + a._count.clinics;
              const isBusy = busyId === a.id;
              
              return (
                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-medium text-white">{a.street || "—"}</td>
                  <td className="p-4 text-white/60">{a.city}, {a.state} {a.zipCode}</td>
                  <td className="p-4 text-white/60">
                    {usage > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                            {usage} Active Link{usage !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="text-white/20 italic">Unused</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => deleteAddr(a.id, usage)} 
                        disabled={isBusy}
                        className="text-red-400 hover:text-red-300 transition-colors opacity-60 hover:opacity-100 disabled:opacity-30"
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
  );
}