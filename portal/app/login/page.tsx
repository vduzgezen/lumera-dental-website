// portal/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lumera.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let message = "Invalid credentials";
        try {
          const data = await res.json();
          if (data && typeof data.error === "string") {
            message = data.error;
          }
        } catch { /* ignore */ }
        setError(message);
        setLoading(false);
        return;
      }
      router.push("/portal/cases");
    } catch (err) {
      console.error(err);
      setError("Unable to reach server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-midnight flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-accent2 shadow-[0_0_20px_rgba(121,231,224,0.3)] relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
            </div>
            <span className="text-2xl font-light tracking-wide text-white">Lumera</span>
          </Link>
        </div>

        <form onSubmit={onSubmit} className="w-full space-y-6 border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-medium text-white">Welcome back</h1>
            <p className="text-sm text-white/40">Enter your credentials</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">Email</label>
              <input type="email" required className="w-full rounded-lg px-4 py-3 bg-black/20 border border-white/10 text-white focus:outline-none focus:border-accent/50 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">Password</label>
              <input type="password" required className="w-full rounded-lg px-4 py-3 bg-black/20 border border-white/10 text-white focus:outline-none focus:border-accent/50 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full rounded-lg py-3 text-sm font-bold bg-accent text-midnight hover:bg-white transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:text-white transition-colors font-medium">
              Request Access
            </Link>
          </p>
          <Link href="/" className="block text-sm text-white/30 hover:text-white transition-colors">
            ← Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}