// app/portal/cases/MillingDashboard.tsx
"use client";
import { useState } from "react";
import CopyableId from "@/components/CopyableId";

type MillingCase = {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;
  dueDate: Date | string | null;
  product: string;
  shade: string | null;
};

// FIX: Helper to distinguish status colors
function getStatusColor(s: string) {
  if (s === "APPROVED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; // Green = Ready
  if (s === "IN_MILLING") return "bg-purple-500/10 text-purple-400 border-purple-500/20"; // Purple = Active
  return "bg-white/5 text-white/50 border-white/10";
}

export default function MillingDashboard({ cases }: { cases: MillingCase[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shippingMode, setShippingMode] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("UPS");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === cases.length) setSelected(new Set());
    else setSelected(new Set(cases.map((c) => c.id)));
  }

  async function handleDownload() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cases/batch/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Download failed");
      
      // Trigger download blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `milling_batch_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // FIX: Reload to show status update (Approved -> In Milling)
      window.location.reload();
    } catch (e) {
      alert("Download failed. See console.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleShip() {
    if (selected.size === 0) return;
    if (!tracking.trim()) {
        alert("Please enter a tracking number.");
        return;
    }
    setBusy(true);
    try {
        const res = await fetch("/api/cases/batch/ship", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                ids: Array.from(selected),
                tracking,
                carrier
            }),
        });
        if (res.ok) {
            window.location.reload();
        } else {
            throw new Error("Ship failed");
        }
    } catch(e) {
        alert("Failed to update status.");
        setBusy(false);
    }
  }

  return (
    <section className="h-screen w-full flex flex-col p-6 overflow-hidden bg-background">
      <div className="flex-none mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold text-white">Milling Center</h1>
            <p className="text-white/50 text-sm">Active cases ready for production.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">{selected.size} selected</span>
            <button 
                onClick={handleDownload}
                disabled={selected.size === 0 || busy}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 transition"
            >
                {busy ? "Processing..." : "Download Files (ZIP)"}
            </button>
            <button 
                onClick={() => setShippingMode(true)}
                disabled={selected.size === 0 || busy}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold disabled:opacity-50 transition"
            >
                Ship Selected
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-black/60 text-white/70 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
                    <tr>
                        <th className="p-4 w-10">
                            <input type="checkbox" checked={selected.size > 0 && selected.size === cases.length} onChange={toggleAll} 
                                className="rounded border-white/30 bg-black/50" />
                        </th>
                        <th className="p-4 font-medium">Case ID</th>
                        <th className="p-4 font-medium">Patient</th>
                        <th className="p-4 font-medium">Tooth</th>
                        <th className="p-4 font-medium">Product</th>
                        <th className="p-4 font-medium">Shade</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Due</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {cases.map(c => (
                        <tr key={c.id} className={`hover:bg-white/5 transition-colors ${selected.has(c.id) ? "bg-blue-500/10" : ""}`}>
                            <td className="p-4">
                                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} 
                                    className="rounded border-white/30 bg-black/50" />
                            </td>
                            <td className="p-4"><CopyableId id={c.id} truncate /></td>
                            <td className="p-4 font-medium text-white">{c.patientAlias}</td>
                            <td className="p-4 text-white/70">{c.toothCodes}</td>
                            <td className="p-4 text-white/70">{c.product.replace(/_/g, " ")}</td>
                            <td className="p-4 text-white/70">{c.shade || "-"}</td>
                            <td className="p-4">
                                {/* FIX: Use helper function instead of hardcoded purple */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(c.status)}`}>
                                    {c.status.replace(/_/g, " ")}
                                </span>
                            </td>
                            <td className="p-4 text-white/50">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "-"}</td>
                        </tr>
                    ))}
                    {cases.length === 0 && (
                        <tr><td colSpan={8} className="p-12 text-center text-white/40">No cases waiting for milling.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Shipping Modal */}
      {shippingMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-4">Ship {selected.size} Cases</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-white/60 uppercase">Carrier</label>
                        <select value={carrier} onChange={e => setCarrier(e.target.value)}
                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                            <option value="UPS">UPS</option>
                            <option value="FedEx">FedEx</option>
                            <option value="USPS">USPS</option>
                            <option value="DHL">DHL</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-white/60 uppercase">Tracking Number</label>
                        <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="1Z..."
                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent/50 outline-none" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => { setShippingMode(false); setTracking(""); }} className="px-4 py-2 text-white/60 hover:text-white">Cancel</button>
                    <button onClick={handleShip} disabled={busy} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400">
                        {busy ? "Updating..." : "Confirm Shipment"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </section>
  );
}