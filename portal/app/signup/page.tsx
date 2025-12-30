// portal/app/signup/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create User
      const res = await fetch("/api/users/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: "customer" // Default role for public signups
        }),
      });

      if (!res.ok) {
        throw new Error("Registration failed. Email might be taken.");
      }

      // Auto-Login after success
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      router.push("/portal/cases");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-midnight flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo className="w-10 h-10" textClassName="text-3xl" />
          </Link>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full space-y-6 border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur-xl shadow-2xl"
        >
          <div className="text-center space-y-1">
            <h1 className="text-xl font-medium text-white">Create an Account</h1>
            <p className="text-sm text-white/40">Join Lumera Dental</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg px-4 py-3 bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider block">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-lg px-4 py-3 bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider block">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-lg px-4 py-3 bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-bold bg-accent text-midnight hover:bg-white transition-colors shadow-[0_0_20px_rgba(121,231,224,0.15)] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">
            Already have an account? <span className="text-accent">Log In</span>
          </Link>
        </div>
      </div>
    </main>
  );
}