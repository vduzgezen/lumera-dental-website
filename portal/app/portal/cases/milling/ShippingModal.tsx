// FILE: app/portal/cases/milling/ShippingModal.tsx

"use client";

import { useState, useMemo } from "react";
import { ShippingTarget } from "@/lib/types"; // ✅ Import Shared Type

interface Props {
  isOpen: boolean;
  count: number;
  batchValue: number;
  isMixedBatch: boolean;
  uniqueClinics: string[];
  destination: ShippingTarget | null; // ✅ Use explicit Type
  onClose: () => void;
  onConfirm: (carrier: string, tracking: string, cost?: number) => void;
  isSaving: boolean;
}

export default function ShippingModal({ 
  isOpen, count, batchValue, 
  isMixedBatch, uniqueClinics, destination,
  onClose, onConfirm, isSaving 
}: Props) {
  const [carrier, setCarrier] = useState("UPS");
  const [otherCarrier, setOtherCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [shippingCost, setShippingCost] = useState(""); 

  const tier = useMemo(() => {
    if (batchValue >= 300) return { label: "Free Standard Overnight", color: "text-purple-400", bg: "bg-purple-500/10", free: true };
    if (batchValue >= 200) return { label: "Free 2-Day Shipping", color: "text-blue-400", bg: "bg-blue-500/10", free: true };
    if (batchValue >= 90) return { label: "Free UPS Ground", color: "text-emerald-400", bg: "bg-emerald-500/10", free: true };
    return { label: "Paid Shipping Required", color: "text-orange-400", bg: "bg-orange-500/10", free: false };
  }, [batchValue]);

  const handleSubmit = () => {
    const finalCarrier = carrier === "Other" ? otherCarrier : carrier;
    if (!finalCarrier) return alert("Please specify a carrier.");
    if (!tracking) return alert("Please enter a tracking number.");
    
    if (!tier.free && !shippingCost) {
        return alert("Batch value is under $90. Please enter the shipping cost.");
    }

    onConfirm(finalCarrier, tracking, tier.free ? 0 : Number(shippingCost));
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div>
            <h3 className="text-lg font-semibold text-foreground">Ship Batch</h3>
            <p className="text-sm text-muted">
            Applying shipment to <span className="text-foreground font-bold">{count}</span> cases.
            </p>
        </div>

        {/* ⚠️ Mixed Batch Warning */}
        {isMixedBatch && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex gap-3 items-start">
                <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <h4 className="text-sm font-bold text-yellow-500">Mixed Clinic Batch</h4>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                        You selected cases from <strong className="text-foreground">{uniqueClinics.length} different clinics</strong>. 
                        Ensure you are physically shipping these to the same location, or create separate batches.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {uniqueClinics.map(c => (
                            <span key={c} className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-200 rounded border border-yellow-500/20 truncate max-w-[150px]">
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* 📍 Shipping Destination Card */}
        {!isMixedBatch && destination ? (
            <div className="bg-white text-black p-4 rounded-lg shadow-lg border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/40">Ship To</span>
                    
                    <div className="flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded text-[10px] font-bold text-black/60 border border-black/5">
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {destination.phone || "No Phone"}
                    </div>
                </div>

                <div className="font-mono text-sm leading-tight space-y-1">
                    <div className="font-bold text-lg uppercase tracking-tight">{destination.name}</div>
                    
                    {destination.attn && (
                        <div className="text-xs font-bold text-black/50 uppercase">{destination.attn}</div>
                    )}
                    
                    <div className="border-t border-black/10 my-1 pt-1"></div>
                    
                    <div>{destination.street}</div>
                    <div>{destination.city}, {destination.state} {destination.zip}</div>
                </div>
            </div>
        ) : !isMixedBatch && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs text-center">
                ⚠️ Missing address information. Please check doctor profile.
            </div>
        )}

        {/* 💰 Batch Value */}
        <div className="bg-surface rounded-lg p-3 border border-border space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Batch Value (Haus)</span>
                <span className="font-bold text-foreground">{formatMoney(batchValue)}</span>
            </div>
            
            <div className={`p-2 rounded text-xs font-bold text-center border border-border ${tier.bg} ${tier.color}`}>
                {tier.label}
            </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted uppercase block mb-1">Carrier</label>
                    <select
                        className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                    >
                        <option value="UPS">UPS</option>
                        <option value="FedEx">FedEx</option>
                        <option value="USPS">USPS</option>
                        <option value="DHL">DHL</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted uppercase block mb-1">Tracking</label>
                    <input
                        className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent"
                        placeholder="1ZA..."
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                    />
                </div>
            </div>

            {carrier === "Other" && (
                <input
                    className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent"
                    placeholder="Enter Carrier Name..."
                    value={otherCarrier}
                    onChange={(e) => setOtherCarrier(e.target.value)}
                />
            )}

            {!tier.free && (
                <div className="animate-in fade-in bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                    <label className="text-xs font-bold text-orange-400 uppercase block mb-1">Shipping Cost ($)</label>
                    <input
                        type="number"
                        className="w-full bg-surface-highlight border border-orange-500/30 rounded-lg p-2 text-foreground outline-none focus:border-orange-500"
                        placeholder="0.00"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                    />
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-foreground transition"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !tracking || (carrier === "Other" && !otherCarrier)}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Confirm Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}