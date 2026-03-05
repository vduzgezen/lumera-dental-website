// features/admin/components/BillingPayButton.tsx
"use client";

import { useState } from "react";
import StripeCheckoutModal from "./StripeCheckoutModal";
import { cn } from "@/lib/utils";

type Props = {
  caseId?: string;
  clinicId: string;
  amount: number;
  month: number;
  year: number;
  disabled?: boolean;
};

export default function BillingPayButton({ clinicId, amount, month, year, disabled }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  async function handlePayClick() {
    setIsPaying(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, amount, month, year }),
      });
      const data = await res.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        alert(data.error || "Failed to initialize checkout.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsPaying(false);
    }
  }

  if (amount <= 0) return null;

  return (
    <>
      <button 
        onClick={handlePayClick} 
        disabled={disabled || isPaying}
        // ✅ The Ultimate Fix: Bypasses global conflicts and strictly follows your CSS variables
        className="px-4 py-2 rounded-xl border border-[var(--border)] bg-surface text-[var(--foreground)] text-sm font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer hover:!bg-[var(--accent)] hover:!border-[var(--accent)] hover:!text-white disabled:!opacity-50 disabled:!cursor-not-allowed shadow-sm"
      >
        {isPaying ? (
          <span className="animate-pulse">Connecting...</span>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Statement Balance
          </>
        )}
      </button>

      {clientSecret && (
        <StripeCheckoutModal 
          clientSecret={clientSecret} 
          onClose={() => {
            setClientSecret(null);
            // ✅ After payment, we force a refresh to the specific month/year 
            window.location.href = `/portal/billing?month=${month}&year=${year}`;
          }} 
        />
      )}
    </>
  );
}