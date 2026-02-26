// FILE: app/portal/cases/milling/ShippingModal.tsx

"use client";

import { useState, useMemo } from "react";
import { ShippingTarget } from "@/lib/types";

interface Props {
  isOpen: boolean;
  count: number;
  batchValue: number;
  isMixedBatch: boolean;
  uniqueClinics: string[];
  destination: ShippingTarget | null;
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
    if (batchValue >= 300) return { label: "Free Standard Overnight", color: "text-purple-500", bg: "bg-purple-500/10", free: true };
    if (batchValue >= 200) return { label: "Free 2-Day Shipping", color: "text-blue-500", bg: "bg-blue-500/10", free: true };
    if (batchValue >= 90) return { label: "Free UPS Ground", color: "text-emerald-500", bg: "bg-emerald-500/10", free: true };
    return { label: "Paid Shipping Required", color: "text-orange-500", bg: "bg-orange-500/10", free: false };
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
    // ✅ FIX: Overlay uses `bg-background/80` to perfectly adapt to Light/Dark mode
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 transition-colors duration-200">
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
                    <h4 className="text-sm font-bold text-yellow-600 dark:text-yellow-500">Mixed Clinic Batch</h4>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                        You selected cases from <strong className="text-foreground">{uniqueClinics.length} different clinics</strong>.
                        Ensure you are physically shipping these to the same location, or create separate batches.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {uniqueClinics.map(c => (
                            <span key={c} className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded border border-yellow-500/30 truncate max-w-[150px]">
                                {c}
                            </span>
                        ))}
                    </div>
                 </div>
            </div>
        )}

        {/* 📍 Shipping Destination Card */}
        {!isMixedBatch && destination ? (
            <div className="bg-surface-highlight text-foreground p-4 rounded-lg shadow-sm border border-border relative overflow-hidden transition-colors">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Ship To</span>
                    
                    <div className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded text-[10px] font-bold text-muted border border-border">
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {destination.phone || "No Phone"}
                    </div>
                </div>

                <div className="font-mono text-sm leading-tight space-y-1">
                    <div className="font-bold text-lg uppercase tracking-tight">{destination.name}</div>
                    {destination.attn && (
                        <div className="text-xs font-bold text-muted uppercase">{destination.attn}</div>
                    )}
                    <div className="border-t border-border my-1 pt-1"></div>
                    <div>{destination.street}</div>
                    <div>{destination.city}, {destination.state} {destination.zip}</div>
                </div>
             </div>
        ) : !isMixedBatch && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs text-center font-bold">
                ⚠️ Missing address information. Please check doctor profile.
            </div>
        )}

        {/* 💰 Batch Value */}
        <div className="bg-surface rounded-lg p-3 border border-border space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Batch Value (Haus)</span>
                <span className="font-bold text-foreground">{formatMoney(batchValue)}</span>
            </div>
            
            <div className={`p-2 rounded text-xs font-bold text-center border border-border shadow-sm ${tier.bg} ${tier.color}`}>
                {tier.label}
            </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted uppercase block mb-1">Carrier</label>
                    <select
                        className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors shadow-sm cursor-pointer"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                    >
                        <option value="UPS" className="bg-surface">UPS</option>
                        <option value="FedEx" className="bg-surface">FedEx</option>
                        <option value="USPS" className="bg-surface">USPS</option>
                        <option value="DHL" className="bg-surface">DHL</option>
                        <option value="Other" className="bg-surface">Other</option>
                    </select>
                 </div>
                
                <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted uppercase block mb-1">Tracking</label>
                    <input
                        className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors shadow-sm placeholder-muted"
                        placeholder="1ZA..."
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                     />
                </div>
            </div>

            {carrier === "Other" && (
                <input
                    className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors shadow-sm placeholder-muted"
                     placeholder="Enter Carrier Name..."
                    value={otherCarrier}
                    onChange={(e) => setOtherCarrier(e.target.value)}
                />
            )}

            {!tier.free && (
                <div className="animate-in fade-in bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                    <label className="text-xs font-bold text-orange-500 uppercase block mb-1">Shipping Cost ($)</label>
                    <input
                        type="number"
                        className="w-full bg-surface-highlight border border-orange-500/30 rounded-lg p-2 text-foreground outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm placeholder-muted"
                        placeholder="0.00"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                    />
                </div>
            )}
        </div>

        {/* Actions */}
        {/* ✅ FIX: Flawless Secondary/Primary Button styling matching Admin UI */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted bg-surface hover:text-foreground hover:bg-[var(--accent-dim)] border border-transparent hover:border-border transition-all rounded-lg font-bold shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !tracking || (carrier === "Other" && !otherCarrier)}
            className="px-6 py-2 bg-foreground text-background font-bold border-2 border-foreground rounded-lg hover:opacity-80 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Confirm Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}