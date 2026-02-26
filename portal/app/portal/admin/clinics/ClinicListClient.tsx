// portal/app/portal/admin/clinics/ClinicListClient.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import ClinicForm from "@/features/admin/components/ClinicForm";
import { AdminTabs } from "@/features/admin/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClinicListClient({ clinics }: { clinics: any[] }) {
  const router = useRouter();
  const [editingClinic, setEditingClinic] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" | null }>({ key: null, direction: null });

  function requestDelete(id: string) { 
    setDeletingId(id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clinics/${deletingId}`, { method: "DELETE" });

      if (res.ok) {
        router.refresh();
        setDeletingId(null);
      } else {
        const j = await res.json();
        alert(j.error || "Failed to delete");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter and Sort Logic
  const filteredClinics = useMemo(() => {
    let result = clinics;

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.address?.city?.toLowerCase().includes(q) ||
          c.address?.state?.toLowerCase().includes(q)
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

        if (key === "city") {
          aVal = a.address?.city || "";
          bVal = b.address?.city || "";
        }
        if (key === "users") {
          aVal = a._count?.users || 0;
          bVal = b._count?.users || 0;
        }
        if (key === "cases") {
          aVal = a._count?.cases || 0;
          bVal = b._count?.cases || 0;
        }

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [clinics, searchQuery, sortConfig]);

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
        
        {/* ✅ FIX: Primary button style matching Users page */}
        <button 
          onClick={() => setIsCreating(true)} 
          className="px-4 py-2 rounded-lg text-sm border-2 border-foreground bg-foreground text-background font-bold shadow-sm hover:opacity-80 transition-all cursor-pointer"
        >
          + New Clinic
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
        
        {/* ✅ NEW: Search Bar */}
        <div className="p-3 border-b border-border bg-surface flex items-center">
          <div className="relative max-w-sm w-full">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Clinic Name, City, or State..."
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
                <SortableHeader label="Clinic Name" colKey="name" />
                <SortableHeader label="City/State" colKey="city" />
                <SortableHeader label="Users" colKey="users" />
                <SortableHeader label="Cases" colKey="cases" />
                <th className="p-4 font-medium text-right text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClinics.map((c) => (
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
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* ✅ FIX: Edit/Delete button styles matching Users page */}
                      <button 
                        onClick={() => setEditingClinic(c)} 
                        className="px-3 py-1 rounded text-accent hover:bg-[var(--accent-dim)] hover:text-foreground transition-all font-medium border border-transparent hover:border-border cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => requestDelete(c.id)} 
                        className="px-3 py-1 rounded text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all font-medium border border-transparent hover:border-red-500/20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClinics.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">No clinics found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || editingClinic) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <ClinicForm 
            initialData={editingClinic}
            onClose={() => { setEditingClinic(null); setIsCreating(false); }}
          />
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2 text-red-500">Delete Clinic?</h3>
            <p className="text-muted text-sm mb-6">This action cannot be undone. Warning: This will fail if users are linked to this clinic.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeletingId(null)} 
                disabled={isDeleting} 
                className="px-4 py-2 rounded font-bold text-muted hover:bg-[var(--accent-dim)] hover:text-foreground transition-all border border-transparent hover:border-border cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting} 
                className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
