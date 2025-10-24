"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function LoginPage() {
  const [email, setEmail] = useState("admin@lumera.dental");
  const [password, setPassword] = useState("Passw0rd!");
  const [error, setError] = useState<string|undefined>();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(undefined);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) router.push("/portal/cases");
    else setError("Invalid credentials");
  }

  return (
    <main className="min-h-screen grid place-items-center bg-black text-white p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border border-white/15 rounded-2xl p-6 bg-white/5 backdrop-blur">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input className="w-full rounded-lg p-2 bg-black/40 border border-white/10" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full rounded-lg p-2 bg-black/40 border border-white/10" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button className="w-full rounded-lg py-2 bg-white text-black font-medium">Continue</button>
      </form>
    </main>
  );
}
