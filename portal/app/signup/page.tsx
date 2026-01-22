// portal/app/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    // Clinic Name removed from UI
    street: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <main className="h-screen w-full bg-midnight flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">Request Sent</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Thank you, {form.name}. Our team will review your information and send an approval email shortly.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    // FIX: 'h-screen overflow-hidden' ensures no scrolling
    <main className="h-screen w-full bg-midnight flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="w-full max-w-2xl relative z-10 flex flex-col max-h-full">
            <div className="mb-6 text-center flex-none">
                <Link href="/" className="inline-block text-2xl font-light tracking-wide text-white mb-2">Lumera</Link>
                <h1 className="text-2xl font-semibold text-white">Request Access</h1>
                <p className="text-white/40 text-sm mt-1">Enter your details to create an account.</p>
            </div>

            <form onSubmit={onSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl flex flex-col gap-5 overflow-y-auto custom-scrollbar">
                
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-white/5 pb-2">Account Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 uppercase">Full Name *</label>
                            <input required name="name" value={form.name} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 outline-none" placeholder="Dr. Jane Doe" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 uppercase">Email Address *</label>
                            <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 outline-none" placeholder="doctor@clinic.com" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-white/60 uppercase">Phone Number *</label>
                        <input required name="phone" value={form.phone} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 outline-none" placeholder="(555) 000-0000" />
                    </div>
                </div>

                {/* Address Info (Moved under Account) */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-white/5 pb-2">Address</h3>
                    <div className="space-y-1">
                        <label className="text-xs text-white/60 uppercase">Street Address *</label>
                        <input required name="street" value={form.street} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent/50 outline-none" placeholder="123 Main St" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 uppercase">City *</label>
                            <input required name="city" value={form.city} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none" placeholder="City" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 uppercase">State *</label>
                            <input required name="state" value={form.state} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none" placeholder="State" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 uppercase">Zip *</label>
                            <input required name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none" placeholder="Zip" />
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">{error}</p>}

                <div className="pt-2 flex items-center justify-between mt-auto">
                    <Link href="/login" className="text-sm text-white/40 hover:text-white transition">← Back to Login</Link>
                    <button type="submit" disabled={busy} className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                        {busy ? "Submitting..." : "Request Access"}
                    </button>
                </div>
            </form>
        </div>
    </main>
  );
}