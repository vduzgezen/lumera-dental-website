// portal/app/portal/admin/users/UserListClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserForm from "@/components/UserForm";
import { AdminTabs } from "@/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserListClient({ users, clinics }: { users: any[], clinics: any[] }) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // NEW: State for the delete confirmation modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger the modal instead of window.confirm
  function requestDelete(id: string) {
    setDeletingId(id);
  }

  // Actual delete logic
  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/users/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        setDeletingId(null); // Close modal on success
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

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-none flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white hidden sm:block">Admin</h1>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <AdminTabs />
         </div>
        
        <button 
          onClick={() => setIsCreating(true)} 
          className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-white/5"
        >
          + Add User
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-white/10 bg-black/20 shadow-2xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Clinic</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 font-medium text-white">{u.name || "—"}</td>
                <td className="p-4 text-white/60">{u.email}</td>
                <td className="p-4">
                  {/* UPDATED: Added Yellow style for 'milling' role */}
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    u.role === "admin" ? "bg-red-500/20 text-red-300" :
                    u.role === "lab" ? "bg-blue-500/20 text-blue-300" :
                    u.role === "milling" ? "bg-yellow-500/20 text-yellow-300" : // <--- HERE
                    "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-white/60">{u.clinic?.name || "—"}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setEditingUser(u)} 
                        className="text-accent hover:text-white transition-colors"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => requestDelete(u.id)} 
                        className="text-red-400 hover:text-red-300 transition-colors"
                    >
                        Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isCreating || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <UserForm 
            clinics={clinics}
            initialData={editingUser}
            onClose={() => { setEditingUser(null); setIsCreating(false); }}
          />
        </div>
      )}

      {/* NEW: Custom Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">Delete User?</h3>
            </div>
            
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this user? This action cannot be undone and may affect linked cases.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition shadow-lg shadow-red-900/20 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}