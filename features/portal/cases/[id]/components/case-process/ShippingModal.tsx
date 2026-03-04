//portal/components/case-process/ShippingModal.tsx
"use client";

import { useState } from "react";

interface ShippingModalProps {
  isOpen: boolean;
  busy: boolean;
  initialCarrier?: string;
  initialTracking?: string;
  onClose: () => void;
  onSubmit: (data: { carrier: string; tracking: string }) => void;
}

export function ShippingModal({
  isOpen,
  busy,
  initialCarrier,
  initialTracking,
  onClose,
  onSubmit,
}: ShippingModalProps) {
  const [carrier, setCarrier] = useState(initialCarrier || "UPS");
  const [tracking, setTracking] = useState(initialTracking || "");
  const [otherCarrier, setOtherCarrier] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalCarrier = carrier === "Other" ? otherCarrier : carrier;
    if (finalCarrier && tracking) {
      onSubmit({ carrier: finalCarrier, tracking });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-semibold text-foreground">Shipment Details</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Carrier</label>
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

          {carrier === "Other" && (
            <input
              placeholder="Enter Carrier Name"
              className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent"
              value={otherCarrier}
              onChange={(e) => setOtherCarrier(e.target.value)}
            />
          )}

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Tracking Number</label>
            <input
              placeholder="1Z999..."
              className="w-full bg-surface-highlight border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent font-mono"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-foreground transition text-sm font-medium"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !tracking}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition disabled:opacity-50 text-sm"
          >
            {busy ? "Saving..." : "Confirm & Ship"}
          </button>
        </div>
      </div>
    </div>
  );
}