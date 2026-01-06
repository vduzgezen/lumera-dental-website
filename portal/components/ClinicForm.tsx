//components/ClinicForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClinicForm({ initialData, onClose }: { initialData?: any, onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(initialData || {
    name: "", street: "", city: "", state: "", zipCode: "", phone: "",
    taxId: "", bankName: "", routingNumber: "", bankLast4: "",
    billingCycleDay: 1, paymentTerms: 30, priceTier: "STANDARD"
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const url = initialData ? `/api/clinics/${initialData.id}` : "/api/clinics";
    const method = initialData ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      alert("Failed to save");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0a1020] border border-white/10 rounded-xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <h2 className="text-xl font-semibold mb-6">{initialData ? "Edit Clinic" : "New Clinic"}</h2>
        <form onSubmit={save} className="space-y-6">
          
          {/* 1. Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Clinic Name *" required className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Phone" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>

          {/* 2. Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <input placeholder="Street" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.street || ""} onChange={e => setForm({...form, street: e.target.value})} />
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="City" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                  value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} />
                <input placeholder="State" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                  value={form.state || ""} onChange={e => setForm({...form, state: e.target.value})} />
                <input placeholder="Zip" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                  value={form.zipCode || ""} onChange={e => setForm({...form, zipCode: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 3. Financials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Billing & Financials</h3>
            <div className="grid grid-cols-3 gap-4">
               <select className="p-2 bg-white/5 border border-white/10 rounded text-white"
                  value={form.priceTier} onChange={e => setForm({...form, priceTier: e.target.value})}>
                  <option value="STANDARD">Standard</option>
                  <option value="IN_HOUSE">In-House</option>
               </select>
               <input type="number" placeholder="Cycle Day (1-28)" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.billingCycleDay} onChange={e => setForm({...form, billingCycleDay: e.target.value})} />
               <input type="number" placeholder="Net Terms (e.g. 30)" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} />
            </div>
            
            {/* Banking */}
            <div className="grid grid-cols-2 gap-4">
               <input placeholder="Bank Name" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.bankName || ""} onChange={e => setForm({...form, bankName: e.target.value})} />
               <input placeholder="Tax ID" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.taxId || ""} onChange={e => setForm({...form, taxId: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input placeholder="Routing Number" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.routingNumber || ""} onChange={e => setForm({...form, routingNumber: e.target.value})} />
               <input placeholder="Account Last 4" className="p-2 bg-white/5 border border-white/10 rounded text-white" 
                 value={form.bankLast4 || ""} onChange={e => setForm({...form, bankLast4: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white">Cancel</button>
            <button type="submit" disabled={busy} className="px-6 py-2 bg-accent text-midnight font-bold rounded hover:bg-white transition">
              {busy ? "Saving..." : "Save Clinic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}