//components/UserForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressPicker, { AddressData } from "@/components/AddressPicker";

type Clinic = { id: string; name: string };

export default function UserForm({ clinics, initialData, onClose }: { clinics: Clinic[], initialData?: any, onClose?: () => void }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "customer",
    clinicId: initialData?.clinicId || clinics[0]?.id || "",
    newClinicName: "",
    phoneNumber: initialData?.phoneNumber || "",
    preferenceNote: initialData?.preferenceNote || "",
  });
  
  const [address, setAddress] = useState<AddressData>({
    id: initialData?.address?.id || null,
    street: initialData?.address?.street || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    zipCode: initialData?.address?.zipCode || ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const url = isEdit ? `/api/users/${initialData.id}` : "/api/users/new";
      const method = isEdit ? "PUT" : "POST";

      const payload = { ...formData, address };
      if (payload.newClinicName) delete (payload as any).clinicId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMsg(isEdit ? "User updated!" : "User created!");
      if (!isEdit) {
        setFormData({
          name: "", email: "", role: "customer",
          clinicId: clinics[0]?.id || "", newClinicName: "",
          phoneNumber: "", preferenceNote: ""
        });
        setAddress({ id: null, street: "", city: "", state: "", zipCode: "" });
      }
      
      router.refresh();
      if (onClose) setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message || "Error saving user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-[#1e1e1e] p-6 rounded-xl border border-white/5 shadow-2xl">
      <h3 className="text-lg font-medium text-white mb-4">{isEdit ? "Edit User" : "New User"}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Name</label>
          <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Role</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
            <option value="customer">Doctor (Customer)</option>
            <option value="lab">Lab Tech</option>
            <option value="admin">Admin</option>
            <option value="milling">Milling Center</option> {/* NEW OPTION */}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Email</label>
            <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
        </div>
        <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Phone</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
            value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="(555) 000-0000" />
        </div>
      </div>

      <AddressPicker value={address} onChange={setAddress} />

      {formData.role === "customer" && (
        <div className="space-y-4 pt-2 border-t border-white/5">
           <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
             <label className="block text-xs font-medium text-white/60 uppercase">Assign Clinic</label>
             <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                value={formData.clinicId} onChange={(e) => setFormData({...formData, clinicId: e.target.value})} disabled={!!formData.newClinicName}>
                <option value="">-- Select Clinic --</option>
                {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
             </select>
           </div>
           <div>
                <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Preference Note</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none resize-none"
                    value={formData.preferenceNote} onChange={(e) => setFormData({...formData, preferenceNote: e.target.value})} placeholder="Doctor preferences..." />
            </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        {onClose && <button type="button" onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white transition">Cancel</button>}
        <button type="submit" disabled={loading} className="px-6 py-2 bg-accent text-background font-bold rounded-lg hover:bg-white transition-colors">
          {loading ? "Saving..." : (isEdit ? "Update User" : "Create User")}
        </button>
      </div>
    </form>
  );
}