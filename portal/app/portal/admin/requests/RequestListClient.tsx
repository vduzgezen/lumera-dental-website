// portal/app/portal/admin/requests/RequestListClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      
      // DEBUG: Check status before parsing JSON
      if (!res.ok) {
        const text = await res.text(); // Get raw text (likely HTML)
        console.error("API Error:", res.status, text); // Log to browser console
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.warning) {
        alert("Warning: " + data.warning);
      }

      router.refresh();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Operation failed. Check console for details.");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex-1 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center text-white/40">
        No pending requests.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-white/10 bg-black/20 shadow-2xl">
      <table className="w-full text-left text-sm min-w-[800px]">
        <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md z-10">
          <tr>
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Clinic Info</th>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {requests.map((r) => (
            <tr key={r.id} className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">{r.name}</td>
              <td className="p-4 text-white/60">{r.email}</td>
              <td className="p-4 text-white/60">
                <div className="text-white font-medium">{r.clinicName}</div>
                <div className="text-xs opacity-70">
                  {r.city}, {r.state}
                </div>
              </td>
              <td className="p-4 text-white/40">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 rounded bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50"
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
  );
}