"use client";
import { useState } from "react";

export default function FileUploader({
  caseId,
  role,
}: {
  caseId: string;
  role: "customer" | "lab" | "admin";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  if (role === "customer") return null; // doctors don’t upload for now

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(undefined);

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const r = await fetch(`/api/cases/${caseId}/files`, {
      method: "POST",
      body: fd,
    });

    setBusy(false);
    if (r.ok) {
      // refresh to show new files
      if (typeof window !== "undefined") window.location.reload();
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Upload failed");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm text-white/80">
          Upload STL / Images (JPG/PNG/WebP)
        </span>
        <input
          type="file"
          accept=".stl,.jpg,.jpeg,.png,.webp"
          multiple
          disabled={busy}
          onChange={onChange}
          className="mt-1 block w-full text-sm"
        />
      </label>
      {busy && <p className="text-white/60 text-sm">Uploading…</p>}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
