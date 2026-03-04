// portal/features/admin/components/ClinicForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressPicker, { AddressData } from "@/components/AddressPicker";

export default function ClinicForm({ initialData, onClose }: { initialData?: any, onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(initialData || {
    name: "", phone: "",
    taxId: "", bankName: "", routingNumber: "", bankLast4: "",
    billingCycleDay: 1, paymentTerms: 30, priceTier: "STANDARD"
  });
  const [address, setAddress] = useState<AddressData>({
    id: initialData?.address?.id || null,
    street: initialData?.address?.street || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    zipCode: initialData?.address?.zipCode || ""
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const url = initialData ? `/api/clinics/${initialData.id}` : "/api/clinics";
    const method = initialData ? "PUT" : "POST";
    
    const payload = { ...form, address };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      alert("Failed to save");
      setBusy(false);
    }
  }

  // ✅ PREVENT ENTER SUBMISSION
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  const set = (field: string, val: any) => setForm((prev: any) => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      {/* Layout Container: Flex column to manage scrolling vs fixed footer */}
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0">
           <h2 className="text-xl font-semibold text-foreground">{initialData ? "Edit Clinic" : "New Clinic"}</h2>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={save} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Clinic Name *" required className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                value={form.name} onChange={e => set("name", e.target.value)} />
              <input placeholder="Phone" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>

          <AddressPicker value={address} onChange={setAddress} />

          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Billing & Financials</h3>
            <div className="grid grid-cols-3 gap-4">
               <select className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none"
                  value={form.priceTier} onChange={e => set("priceTier", e.target.value)}>
                  <option value="STANDARD">Standard</option>
                  <option value="IN_HOUSE">In-House</option>
               </select>
               <input type="number" placeholder="Cycle Day (1-28)" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.billingCycleDay} onChange={e => set("billingCycleDay", e.target.value)} />
               <input type="number" placeholder="Net Terms (e.g. 30)" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.paymentTerms} onChange={e => set("paymentTerms", e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <input placeholder="Bank Name" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} />
               <input placeholder="Tax ID" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.taxId || ""} onChange={e => set("taxId", e.target.value)} />
            </div>
           
            <div className="grid grid-cols-2 gap-4">
               <input placeholder="Routing Number" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.routingNumber || ""} onChange={e => set("routingNumber", e.target.value)} />
               <input placeholder="Account Last 4" className="p-2 bg-surface-highlight border border-border rounded-lg text-foreground focus:border-accent/50 outline-none" 
                 value={form.bankLast4 || ""} onChange={e => set("bankLast4", e.target.value)} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex justify-end gap-3 rounded-b-xl shrink-0">
            {/* ✅ FIX: Secondary button style matching Users page */}
            <button type="button" onClick={onClose} 
              className="px-4 py-2 text-muted bg-surface hover:text-foreground hover:bg-[var(--accent-dim)] border border-transparent hover:border-border transition-all rounded-lg font-bold shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            {/* ✅ FIX: Primary button style matching Users page */}
            <button onClick={save} disabled={busy} 
              className="px-6 py-2 bg-foreground text-background font-bold border-2 border-foreground rounded-lg hover:opacity-80 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Saving..." : "Save Clinic"}
            </button>
        </div>
      </div>
    </div>
  );
}
