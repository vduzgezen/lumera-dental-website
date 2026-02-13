// portal/app/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
      <main className="h-screen w-full bg-background flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-medium text-foreground mb-2">Request Sent</h2>
          <p className="text-muted mb-8 leading-relaxed">
            Thank you, {form.name}. Our team will review your information and send an approval email shortly.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="w-full max-w-2xl relative z-10 flex flex-col max-h-full">
            <div className="mb-6 text-center flex-none">
                <Link href="/" className="inline-block text-2xl font-light tracking-wide text-foreground mb-2">Lumera</Link>
                <h1 className="text-2xl font-semibold text-foreground">Request Access</h1>
                <p className="text-muted text-sm mt-1">Enter your details to create an account.</p>
            </div>

            <form onSubmit={onSubmit} className="bg-surface border border-border rounded-2xl p-8 shadow-2xl flex flex-col gap-5 overflow-y-auto custom-scrollbar">
                
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-border pb-2">Account Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase">Full Name *</label>
                            <input 
                              required 
                              name="name" 
                              value={form.name} 
                              onChange={handleChange} 
                              className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:border-accent/50 outline-none" 
                              placeholder="Dr. Jane Doe" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase">Email Address *</label>
                            <input 
                              required 
                              type="email" 
                              name="email" 
                              value={form.email} 
                              onChange={handleChange} 
                              className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:border-accent/50 outline-none" 
                              placeholder="doctor@clinic.com" 
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted uppercase">Phone Number *</label>
                        <input 
                          required 
                          name="phone" 
                          value={form.phone} 
                          onChange={handleChange} 
                          className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:border-accent/50 outline-none" 
                          placeholder="(555) 000-0000" 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-border pb-2">Address</h3>
                    <div className="space-y-1">
                        <label className="text-xs text-muted uppercase">Street Address *</label>
                        <input 
                          required 
                          name="street" 
                          value={form.street} 
                          onChange={handleChange} 
                          className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:border-accent/50 outline-none" 
                          placeholder="123 Main St" 
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase">City *</label>
                            <input 
                              required 
                              name="city" 
                              value={form.city} 
                              onChange={handleChange} 
                              className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted outline-none focus:border-accent/50" 
                              placeholder="City" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase">State *</label>
                            <input 
                              required 
                              name="state" 
                              value={form.state} 
                              onChange={handleChange} 
                              className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted outline-none focus:border-accent/50" 
                              placeholder="State" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase">Zip *</label>
                            <input 
                              required 
                              name="zipCode" 
                              value={form.zipCode} 
                              onChange={handleChange} 
                              className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted outline-none focus:border-accent/50" 
                              placeholder="Zip" 
                            />
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">{error}</p>}

                <div className="pt-2 flex items-center justify-between mt-auto">
                    <Link href="/login" className="text-sm text-muted hover:text-foreground transition">← Back to Login</Link>
                    <button 
                      type="submit" 
                      disabled={busy} 
                      className="px-8 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition disabled:opacity-50"
                    >
                        {busy ? "Submitting..." : "Request Access"}
                    </button>
                </div>
            </form>
        </div>
    </main>
  );
}
