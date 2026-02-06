// portal/components/UserForm.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddressPicker, { AddressData } from "@/components/AddressPicker";
import SearchableSelect from "@/components/SearchableSelect";
import ClinicForm from "@/components/ClinicForm"; 

type Clinic = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string };

export default function UserForm({ 
  clinics, 
  salesReps = [], 
  initialData, 
  onClose 
}: { 
  clinics: Clinic[], 
  salesReps?: UserOption[],
  initialData?: any, 
  onClose?: () => void 
}) {
  const router = useRouter();
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "customer",
    clinicId: initialData?.clinicId || "", 
    phoneNumber: initialData?.phoneNumber || "",
    preferenceNote: initialData?.preferenceNote || "",
    salesRepId: initialData?.salesRepId || "", // ✅ STATE
  });

  const [address, setAddress] = useState<AddressData>({
    id: initialData?.address?.id || null,
    street: initialData?.address?.street || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    zipCode: initialData?.address?.zipCode || ""
  });

  const [secondaryIds, setSecondaryIds] = useState<Set<string>>(new Set());
  const [secondarySearch, setSecondarySearch] = useState(""); 
  const [showClinicForm, setShowClinicForm] = useState(false);

  useEffect(() => {
    if (initialData?.secondaryClinics) {
      const ids = initialData.secondaryClinics.map((c: any) => c.id);
      setSecondaryIds(new Set(ids));
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const isEdit = !!initialData;

  // --- HELPERS ---

  const toggleSecondary = (id: string) => {
    const next = new Set(secondaryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSecondaryIds(next);
  };

  const clinicOptions = useMemo(() => {
    return clinics.map(c => ({ id: c.id, label: c.name }));
  }, [clinics]);

  // ✅ NEW: Rep Options
  const repOptions = useMemo(() => {
    return salesReps.map(r => ({ id: r.id, label: r.name || r.email }));
  }, [salesReps]);

  const filteredSecondaryClinics = useMemo(() => {
    const q = secondarySearch.toLowerCase();
    
    return clinics
      .filter(c => 
        c.id !== formData.clinicId && // Exclude primary
        c.name.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aChecked = secondaryIds.has(a.id);
        const bChecked = secondaryIds.has(b.id);
        
        if (aChecked === bChecked) return a.name.localeCompare(b.name);
        return aChecked ? -1 : 1;
      });
  }, [clinics, formData.clinicId, secondarySearch, secondaryIds]);

  // --- SUBMIT ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const url = isEdit ? `/api/users/${initialData.id}` : "/api/users/new";
      const method = isEdit ? "PUT" : "POST";

      const payload = { 
        ...formData, 
        address,
        secondaryClinicIds: Array.from(secondaryIds) 
      };

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
          clinicId: "", phoneNumber: "", preferenceNote: "",
          salesRepId: ""
        });
        setAddress({ id: null, street: "", city: "", state: "", zipCode: "" });
        setSecondaryIds(new Set());
      }
      
      router.refresh();
      if (onClose) setTimeout(onClose, 800);

    } catch (err: any) {
      setError(err.message || "Error saving user.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  return (
    <>
      <div className="w-full max-w-lg bg-[#111b2d] rounded-xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
        
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-medium text-white">{isEdit ? "Edit User" : "New User"}</h3>
             <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Admin Console</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Name</label>
              <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Role</label>
              <select className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="customer">Doctor (Customer)</option>
                <option value="lab">Lab Tech</option>
                <option value="admin">Admin</option>
                <option value="milling">Milling Center</option>
                <option value="sales">Sales Rep</option> {/* ✅ ADDED */}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Email</label>
                <input type="email" required className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
            </div>
            <div>
                <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Phone</label>
                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
                value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="(555) 000-0000" />
            </div>
          </div>

          <AddressPicker value={address} onChange={setAddress} />

          {formData.role === "customer" && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              
              {/* PRIMARY CLINIC */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-medium text-white/60 uppercase">Primary Clinic</label>
                  <button 
                    type="button" 
                    onClick={() => setShowClinicForm(true)} 
                    className="text-[10px] font-bold text-accent hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    + New Clinic
                  </button>
                </div>
                
                <SearchableSelect
                  label=""
                  placeholder="Search Primary Clinic..."
                  options={clinicOptions}
                  value={formData.clinicId}
                  onChange={(val) => setFormData({ ...formData, clinicId: val })}
                />
              </div>

              {/* ✅ NEW: SALES REP SELECTION */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-3">
                <label className="block text-xs font-medium text-white/60 uppercase">Sales Representative</label>
                <SearchableSelect
                  label=""
                  placeholder="Assign a Sales Rep (Optional)..."
                  options={repOptions}
                  value={formData.salesRepId}
                  onChange={(val) => setFormData({ ...formData, salesRepId: val })}
                />
              </div>

              {/* SECONDARY CLINICS */}
              {formData.clinicId && (
                <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-3">
                    <label className="block text-xs font-medium text-white/60 uppercase">Additional Clinics</label>
                    
                    <div className="relative">
                      <input 
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:border-accent/50 outline-none placeholder-white/30"
                        placeholder="Filter list..."
                        value={secondarySearch}
                        onChange={(e) => setSecondarySearch(e.target.value)}
                      />
                      <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 p-1 bg-black/20 rounded border border-white/5">
                      {filteredSecondaryClinics.length === 0 ? (
                        <p className="text-white/30 text-xs italic p-2 text-center">
                          {secondarySearch ? "No matching clinics." : "No other clinics available."}
                        </p>
                      ) : (
                        filteredSecondaryClinics.map(c => {
                          const isChecked = secondaryIds.has(c.id);
                          return (
                            <label key={c.id} className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition ${isChecked ? "bg-white/5 border border-white/5" : "border border-transparent"}`}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? "bg-blue-500 border-blue-500" : "border-white/30"}`}>
                                {isChecked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleSecondary(c.id)} />
                              <span className={`text-sm ${isChecked ? "text-white font-medium" : "text-white/60"}`}>{c.name}</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                </div>
              )}

              <div>
                  <label className="block text-xs font-medium text-white/60 mb-1 uppercase">Preference Note</label>
                  <textarea rows={3} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none resize-none"
                  value={formData.preferenceNote} onChange={(e) => setFormData({...formData, preferenceNote: e.target.value})} placeholder="Doctor preferences..." />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded text-center">{error}</p>}
          {msg && <p className="text-emerald-400 text-sm bg-emerald-500/10 p-2 rounded text-center">{msg}</p>}
        </form>

        <div className="p-4 border-t border-white/10 bg-[#111b2d] flex justify-end gap-3 rounded-b-xl shrink-0">
          {onClose && <button type="button" onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white transition">Cancel</button>}
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-accent text-background font-bold rounded-lg hover:bg-white transition-colors">
            {loading ? "Saving..." : (isEdit ? "Update User" : "Create User")}
          </button>
        </div>
      </div>

      {showClinicForm && (
        <ClinicForm 
          onClose={() => setShowClinicForm(false)} 
        />
      )}
    </>
  );
}