// app/portal/admin/users/new/page.tsx
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewDoctorPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") return notFound();

  const clinics = await prisma.clinic.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Doctor</h1>
        <Link href="/portal/cases" className="text-white/80 underline">← Back</Link>
      </header>

      <form
        action={async (formData) => {
          "use server";
        }}
        className="space-y-4 max-w-xl"
      >
        <NewDoctorClient clinics={clinics} />
      </form>
    </section>
  );
}

// Client component inline to keep all code in one file
"use client";
import { useState } from "react";

function NewDoctorClient({ clinics }: { clinics: { id: string; name: string }[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? "");
  const [newClinicName, setNewClinicName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();
  const [err, setErr] = useState<string | undefined>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(undefined);
    setErr(undefined);
    setBusy(true);
    try {
      const r = await fetch("/api/users/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, password, clinicId: newClinicName ? "" : clinicId, newClinicName }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not create doctor");
      setMsg("Doctor created.");
      setEmail(""); setName(""); setPassword(""); setNewClinicName("");
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-sm text-white/70 mb-1">Email</div>
        <input className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
               value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="dr.smith@example.com"/>
      </div>
      <div>
        <div className="text-sm text-white/70 mb-1">Name (optional)</div>
        <input className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
               value={name} onChange={(e)=>setName(e.target.value)} placeholder="Dr. Smith"/>
      </div>
      <div>
        <div className="text-sm text-white/70 mb-1">Password</div>
        <input type="password" className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
               value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="••••••••"/>
      </div>

      <div className="rounded-lg border border-white/10 p-3">
        <div className="text-sm text-white/80 mb-2">Assign to clinic</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className="rounded-lg p-2 bg-black/40 border border-white/10 text-white"
                  disabled={!!newClinicName}
                  value={clinicId} onChange={(e)=>setClinicId(e.target.value)}>
            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="rounded-lg p-2 bg-black/40 border border-white/10 text-white"
                 placeholder="Or create new clinic…"
                 value={newClinicName} onChange={(e)=>setNewClinicName(e.target.value)} />
        </div>
        <p className="text-xs text-white/50 mt-1">If you type a new clinic name, we’ll create it and ignore the dropdown.</p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

      <button disabled={busy} className="rounded-lg px-4 py-2 bg-white text-black">
        {busy ? "Creating…" : "Create Doctor"}
      </button>
    </form>
  );
}
