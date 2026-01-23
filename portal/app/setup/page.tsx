// portal/app/setup/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SetupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      
      // Success -> Redirect to login
      router.push("/login");
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center text-white/60">
        <p>Invalid or missing invitation token.</p>
        <Link href="/login" className="text-accent hover:underline mt-4 block">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-white mb-2 text-center">Set Your Password</h1>
      <p className="text-white/40 text-sm text-center mb-8">Finalize your account setup</p>
      
      <form onSubmit={onSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase mb-2">New Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase mb-2">Confirm Password</label>
          <input 
            type="password" 
            required 
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent/50 outline-none"
          />
        </div>

        {error && <div className="text-red-400 text-sm text-center">{error}</div>}

        <button 
          type="submit" 
          disabled={busy}
          className="w-full py-3 bg-accent text-background font-bold rounded-lg hover:bg-white transition disabled:opacity-50"
        >
          {busy ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
    </div>
  );
}

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-white/50">Loading...</div>}>
        <SetupForm />
      </Suspense>
    </main>
  );
}