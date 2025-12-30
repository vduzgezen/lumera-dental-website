// portal/components/NewUserForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Clinic = {
  id: string;
  name: string;
};

export default function NewUserForm({ clinics }: { clinics: Clinic[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    clinicId: clinics[0]?.id || "",
    newClinicName: "" 
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const payload = {
        ...formData,
        clinicId: formData.newClinicName ? undefined : formData.clinicId
      };

      const res = await fetch("/api/users/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setMsg("User created successfully!");
      setFormData(prev => ({ ...prev, email: "", password: "", newClinicName: "" }));
      router.refresh();
      
    } catch (err: any) {
      // Actually using 'err' here for the message, so we keep it but fix type if needed
      setError(err.message || "Error creating user.");
    } finally {
      setLoading(false);
    }
  }
// ... rest of the file stays exactly the same ...
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-[#0a1020] p-6 rounded-xl border border-white/5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Name</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Dr. Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Role</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="customer">Doctor (Customer)</option>
            <option value="lab">Lab Tech</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Email</label>
        <input
          type="email"
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Password</label>
        <input
          type="password"
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
        />
      </div>

      {/* Clinic Assignment Section - Only for Customers */}
      {formData.role === "customer" && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
          <label className="block text-xs font-medium text-white/60 uppercase">Assign Clinic</label>
          
          <div className="grid grid-cols-1 gap-3">
            <select
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white disabled:opacity-50"
              value={formData.clinicId}
              onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
              disabled={!!formData.newClinicName}
            >
              <option value="">Select Existing Clinic...</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#0a1020] text-white/40">OR CREATE NEW</span>
              </div>
            </div>

            <input
              type="text"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
              placeholder="Enter New Clinic Name..."
              value={formData.newClinicName}
              onChange={(e) => setFormData({ ...formData, newClinicName: e.target.value })}
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-midnight font-bold py-3 rounded-lg hover:bg-white transition-colors"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}