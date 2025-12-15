// portal/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
        } catch {
          // ignore JSON parse errors, fall back to generic message
        }

        setError(message);
        return;
      }

      // ✅ IMPORTANT: redirect to the actual cases route
      router.push("/portal/cases");
    } catch (err) {
      console.error(err);
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border border-white/15 rounded-2xl p-6 bg-white/5 backdrop-blur"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>

        <div className="space-y-2">
          <label className="text-sm text-white/70 block">
            Email
            <input
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg p-2 bg-black/40 border border-white/20 text-sm focus:outline-none focus:ring focus:ring-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70 block">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg p-2 bg-black/40 border border-white/20 text-sm focus:outline-none focus:ring focus:ring-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2 text-sm font-medium bg-white text-black disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>
    </main>
  );
}
