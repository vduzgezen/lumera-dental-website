// portal/app/portal/admin/addresses/AddressListClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminTabs } from "@/features/admin/components/AdminTabs";

export default function AddressListClient({ addresses }: { addresses: any[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" | null }>({ key: null, direction: null });

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

  // Filter and Sort Logic
  const filteredAddresses = useMemo(() => {
    let result = addresses;

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.street?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.state?.toLowerCase().includes(q) ||
          a.zipCode?.toLowerCase().includes(q)
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

        if (key === "usage") {
          aVal = (a._count?.users || 0) + (a._count?.clinics || 0);
          bVal = (b._count?.users || 0) + (b._count?.clinics || 0);
        }

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [addresses, searchQuery, sortConfig]);

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
              placeholder="Search by Street, City, State, or Zip..."
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
          <table className="w-full text-left text-sm min-w-[600px] border-collapse">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <SortableHeader label="Street" colKey="street" />
                <SortableHeader label="City/State" colKey="city" />
                <SortableHeader label="Linked To" colKey="usage" />
                <th className="p-4 font-medium text-right text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAddresses.map((a) => {
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
                      {/* ✅ FIX: Delete button style matching Users page */}
                      <button 
                          onClick={() => deleteAddr(a.id, usage)} 
                          disabled={isBusy}
                          className="px-3 py-1 rounded text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all font-medium border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                          {isBusy ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAddresses.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted">No addresses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
