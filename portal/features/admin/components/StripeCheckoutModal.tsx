// features/admin/components/StripeCheckoutModal.tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Props = {
  clientSecret: string;
  onClose: () => void;
};

export default function StripeCheckoutModal({ clientSecret, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-surface text-foreground w-full max-w-2xl h-auto max-h-[85vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-surface-highlight shrink-0">
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
        <div className="overflow-y-auto custom-scrollbar p-6 bg-surface">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            // ✅ Removed the invalid 'appearance' prop
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

      </div>
    </div>
  );
}