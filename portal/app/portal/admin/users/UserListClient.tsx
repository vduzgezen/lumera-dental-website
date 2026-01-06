//portal/app/portal/admin/users/UserListClient.tsx
"use client";
import { useState } from "react";
import UserForm from "@/components/UserForm";
import { AdminTabs } from "@/components/AdminTabs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserListClient({ users, clinics }: { users: any[], clinics: any[] }) {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. COMPRESSED HEADER */}
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

      {/* 2. CONSISTENT LIST STYLING */}
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
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{u.name || "—"}</td>
                <td className="p-4 text-white/60">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    u.role === "admin" ? "bg-red-500/20 text-red-300" :
                    u.role === "lab" ? "bg-blue-500/20 text-blue-300" :
                    "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-white/60">{u.clinic?.name || "—"}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setEditingUser(u)} 
                    className="text-accent hover:text-white transition-colors"
                  >
                    Edit
                  </button>
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
    </div>
  );
}