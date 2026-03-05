// features/admin/components/StripeCheckoutModal.tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Props = {
  clientSecret: string;
  onClose: () => void;
};

export default function StripeCheckoutModal({ clientSecret, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* 1. Reduced width to max-w-md to natively frame the Stripe form.
        2. overflow-hidden enforces the rounded-2xl clipping onto the iframe.
      */}
      <div className="bg-surface text-foreground w-full max-w-md h-auto max-h-[85vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden border border-[var(--border)]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-surface-highlight shrink-0 z-10 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Secure Checkout</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stripe Embedded UI */}
        {/* Removed p-6: The iframe now sits completely flush with the edges, eliminating the sharp inner borders */}
        <div className="overflow-y-auto custom-scrollbar w-full flex-1 bg-white">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="w-full" />
          </EmbeddedCheckoutProvider>
        </div>

      </div>
    </div>
  );
}