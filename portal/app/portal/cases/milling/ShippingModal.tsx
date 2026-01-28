// portal/app/portal/cases/milling/ShippingModal.tsx
"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  count: number;
  onClose: () => void;
  onConfirm: (carrier: string, tracking: string) => void;
  isSaving: boolean;
}

export default function ShippingModal({ isOpen, count, onClose, onConfirm, isSaving }: Props) {
  const [carrier, setCarrier] = useState("UPS");
  const [otherCarrier, setOtherCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalCarrier = carrier === "Other" ? otherCarrier : carrier;
    if (!finalCarrier) return alert("Please specify a carrier.");
    if (!tracking) return alert("Please enter a tracking number.");
    
    onConfirm(finalCarrier, tracking);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#111b2d] border border-white/10 rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-white">Ship Batch</h3>
        <p className="text-sm text-white/60">
          Applying shipment to <span className="text-white font-bold">{count}</span> cases.
        </p>

        <div>
          <label className="text-xs font-bold text-white/50 uppercase block mb-1">Carrier</label>
          <select
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
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

        {carrier === "Other" && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <input
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
              placeholder="Enter Carrier Name..."
              value={otherCarrier}
              onChange={(e) => setOtherCarrier(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-white/50 uppercase block mb-1">Tracking Number</label>
          <input
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
            placeholder="e.g. 1ZA..."
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            autoFocus={carrier !== "Other"}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !tracking || (carrier === "Other" && !otherCarrier)}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Confirm Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}