// portal/app/portal/admin/requests/RequestListClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTabs } from "@/components/AdminTabs";

export default function RequestListClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (e: any) {
      alert("Operation failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex-none flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-white hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <AdminTabs />
         </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Clinic Info</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-white/40">
                    No pending requests.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{r.name}</td>
                  <td className="p-4 text-white/60">{r.email}</td>
                  <td className="p-4 text-white/60">
                    <div className="text-white font-medium">{r.clinicName}</div>
                    <div className="text-xs opacity-70">{r.city}, {r.state}</div>
                  </td>
                  <td className="p-4 text-white/40">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        {busyId === r.id ? "..." : "Approve"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}