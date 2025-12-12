// components/FileUploader.tsx
"use client";

import { useState } from "react";

type Role = "customer" | "lab" | "admin";

export default function FileUploader({
  caseId,
  role,
  slot, // "scan" | "design_with_model" | "design_only"
}: {
  caseId: string;
  role: Role;
  slot: "scan" | "design_with_model" | "design_only";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);

  if (role === "customer") return null;

  const accept = slot === "scan" ? ".stl,.ply,.obj" : ".stl";

  const labelText =
    slot === "scan"
      ? "Upload scan (STL/PLY/OBJ)"
      : slot === "design_with_model"
      ? "Upload design + model (STL/PLY/OBJ)"
      : "Upload design only (STL/PLY/OBJ)";

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErr(undefined);
    setOk(undefined);
  }

  async function send() {
    if (!file) {
      return setErr("Please choose a file first.");
    }

    setBusy(true);
    setErr(undefined);
    setOk(undefined);

    try {
      const fd = new FormData();
      fd.append("label", slot);
      fd.append("files", file);

      const r = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(j.error || "Upload failed");
      }

      setOk("Uploaded successfully.");
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/60">{labelText}</div>

      <label className="flex items-center justify-between gap-3 rounded-lg p-2 bg-black/40 border border-white/10 cursor-pointer">
        <div className="flex-1 min-w-0 text-white/80">
          {file ? (
            <>
              <div className="font-medium text-xs truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-[10px] text-white/60">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </>
          ) : (
            <div className="text-xs text.white/60 truncate">
              Choose a file…
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-md bg-white text-black px-3 py-1.5 text-xs">
          Browse
        </div>
        <input
          type="file"
          accept={accept}
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy || !file}
          className="rounded-lg px-3 py-1.5 bg-white text-black text-xs disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        {ok && <span className="text-emerald-400 text-xs">{ok}</span>}
        {err && <span className="text-red-400 text-xs">{err}</span>}
      </div>
    </div>
  );
}
