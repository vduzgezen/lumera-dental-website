// components/UploadButtons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  caseId: string;
  label: "SCAN" | "MODEL_PLUS_DESIGN" | "DESIGN_ONLY";
  accept: string;
  title: string;
  disabled?: boolean;
};

export default function UploadButtons({
  caseId,
  label,
  accept,
  title,
  disabled,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function upload() {
    setMsg(null);
    setErr(null);
    if (!file) return setErr("Choose a file first.");
    if (disabled) return setErr("This slot is locked at the current stage.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("label", label);
      // best-effort kind based on extension
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const kind =
        ext === "stl" ? "STL" : ext === "ply" ? "PLY" : ext === "obj" ? "OBJ" : "OTHER";
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Upload failed");

      setMsg("Saved.");
      setFile(null);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <h2 className="font-medium mb-2">{title}</h2>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
          disabled={disabled}
        />
        <button
          type="button"
          className="rounded-md bg-white text-black text-sm px-3 py-1.5 disabled:opacity-50"
          onClick={upload}
          disabled={busy || disabled}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {disabled && (
        <p className="text-xs text-white/50 mt-2">
          This slot can’t be changed at the current stage.
        </p>
      )}
      {msg && <p className="text-emerald-400 text-sm mt-2">{msg}</p>}
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
    </div>
  );
}
