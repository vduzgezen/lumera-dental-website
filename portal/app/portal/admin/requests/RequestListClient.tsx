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
            <h1 className="text-2xl font-semibold text-foreground hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <AdminTabs />
         </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Clinic Info</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted">
                    No pending requests.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--accent-dim)] transition-colors">
                  <td className="p-4 font-medium text-foreground">{r.name}</td>
                  <td className="p-4 text-muted">{r.email}</td>
                  <td className="p-4 text-muted">
                    <div className="text-foreground font-medium">{r.clinicName}</div>
                    <div className="text-xs opacity-70">{r.city}, {r.state}</div>
                  </td>
                  <td className="p-4 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
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