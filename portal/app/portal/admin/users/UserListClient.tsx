// portal/app/portal/admin/users/UserListClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm from "@/features/admin/components/UserForm";
import { AdminTabs } from "@/features/admin/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserListClient({ users, clinics }: { users: any[], clinics: any[] }) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function requestDelete(id: string) { setDeletingId(id); }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingId}`, { method: "DELETE" });
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

  // ✅ Helper to extract unique Sales Reps for the form
  const salesReps = users
    .filter(u => u.role === "sales")
    .map(u => ({ id: u.id, name: u.name, email: u.email }));

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
          + New User
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-surface text-muted sticky top-0 backdrop-blur-md z-10 border-b border-border">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Primary Clinic</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--accent-dim)] transition-colors group">
                  <td className="p-4 font-medium text-foreground">{u.name || "—"}</td>
                  <td className="p-4 text-muted">{u.email}</td>
                  <td className="p-4">
                    {/* ✅ UPDATED ROLE COLORS */}
                    <span className={`px-2 py-1 rounded text-xs font-semibold tracking-wide border ${
                      u.role === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      u.role === "lab" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      u.role === "milling" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      u.role === "sales" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : // ✅ Orange for Sales
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    {u.clinic?.name || <span className="text-muted/50 italic">None</span>}
                    {u.secondaryClinics && u.secondaryClinics.length > 0 && (
                        <span className="ml-2 text-[10px] text-muted border border-border px-1 rounded">
                            +{u.secondaryClinics.length} more
                        </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingUser(u)} className="text-accent hover:text-white transition-colors font-medium">Edit</button>
                      <button onClick={() => requestDelete(u.id)} className="text-red-400 hover:text-red-300 transition-colors font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <UserForm 
            clinics={clinics}
            salesReps={salesReps} // ✅ Pass Reps to Form
            initialData={editingUser}
            onClose={() => { setEditingUser(null); setIsCreating(false); }}
          />
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2 text-red-400">Delete User?</h3>
            <p className="text-muted text-sm mb-6">Action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} disabled={isDeleting} className="px-4 py-2 text-muted hover:text-foreground">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}