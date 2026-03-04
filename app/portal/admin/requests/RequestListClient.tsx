// portal/app/portal/admin/requests/RequestListClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminTabs } from "@/features/admin/components/AdminTabs";

export default function RequestListClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" | null }>({ key: null, direction: null });

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

  // Filter and Sort Logic
  const filteredRequests = useMemo(() => {
    let result = requests;

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.clinicName?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    if (sortConfig.key && sortConfig.direction) {
      // ✅ Assign to a constant to lock the type as 'string' for TypeScript
      const key = sortConfig.key;
      const direction = sortConfig.direction;

      result = [...result].sort((a, b) => {
        let aVal = a[key] || "";
        let bVal = b[key] || "";

        if (key === "date") {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        }

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [requests, searchQuery, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const SortableHeader = ({ label, colKey }: { label: string; colKey: string }) => {
    const isActive = sortConfig.key === colKey;
    return (
      <th
        className={`p-4 font-medium cursor-pointer select-none transition-colors hover:bg-[var(--accent-dim)] hover:text-foreground ${
          isActive ? "text-accent" : "text-muted"
        }`}
        onClick={() => handleSort(colKey)}
      >
        <div className="flex items-center gap-2">
          {label}
          {isActive && (
            <span className="text-accent text-[10px]">
              {sortConfig.direction === "asc" ? "▲" : "▼"}
            </span>
          )}
        </div>
      </th>
    );
  };

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
        
        {/* ✅ NEW: Search Bar */}
        <div className="p-3 border-b border-border bg-surface flex items-center">
          <div className="relative max-w-sm w-full">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, Clinic, or City..."
              className="w-full bg-surface-highlight border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 placeholder:text-muted transition-all shadow-sm" 
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {(searchQuery) && (
            <button 
              onClick={() => setSearchQuery("")}
              className="ml-3 text-xs font-bold text-muted bg-surface hover:text-foreground hover:bg-[var(--accent-dim)] border border-transparent hover:border-border px-3 py-1.5 rounded-md cursor-pointer transition-all shadow-sm"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px] border-collapse">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <SortableHeader label="Name" colKey="name" />
                <SortableHeader label="Email" colKey="email" />
                <SortableHeader label="Clinic Info" colKey="clinicName" />
                <SortableHeader label="Date" colKey="date" />
                <th className="p-4 font-medium text-right text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted">
                    No pending requests.
                  </td>
                </tr>
              )}
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--accent-dim)] transition-colors">
                  <td className="p-4 font-medium text-foreground">{r.name}</td>
                  <td className="p-4 text-muted">{r.email}</td>
                  <td className="p-4 text-muted">
                    <div className="text-foreground font-medium">{r.clinicName}</div>
                    <div className="text-xs text-muted">{r.city}, {r.state}</div>
                  </td>
                  <td className="p-4 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* ✅ FIX: Reject button style */}
                      <button 
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 rounded text-red-500 hover:bg-red-500/10 hover:text-red-600 text-xs font-bold uppercase tracking-wider border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                      {/* ✅ FIX: Approve button style */}
                      <button 
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 rounded text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 text-xs font-bold uppercase tracking-wider border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
