// components/ui/FileUploader.tsx
"use client";

import { useState } from "react";

type Role = "customer" | "lab" | "admin" | "milling";

export default function FileUploader({
  caseId,
  role,
  label,
  slot,
  accept,
  description,
}: {
  caseId: string;
  role: Role;
  label?: string;
  slot?: string;
  accept?: string;
  description?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);

  if (role === "customer") return null;

  const activeLabel = label || slot || "file";
  const labelText = description || activeLabel.replace(/_/g, " ");
  
  const finalAccept = accept || (activeLabel === "construction_info" 
    ? ".pdf,.xml,.txt,.constructionInfo" 
    : ".stl,.ply,.obj");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErr(undefined);
    setOk(undefined);
  }

  async function send() {
    if (!file) return setErr("Please choose a file first.");

    setBusy(true);
    setErr(undefined);
    setOk(undefined);

    try {
      const urlRes = await fetch(`/api/cases/${caseId}/files/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type || "application/octet-stream",
          label: activeLabel
        }),
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload permission");

      const { url, key } = await urlRes.json();

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) throw new Error("Upload to cloud failed");

      const dbRes = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label: activeLabel,
          size: file.size,
          filename: file.name
        }),
      });

      if (!dbRes.ok) throw new Error("Failed to save file record");

      setOk("Uploaded successfully.");
      setTimeout(() => window.location.reload(), 600);

    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted capitalize">{labelText}</div>

      <label className="flex items-center justify-between gap-3 rounded-lg p-2 bg-surface border border-border cursor-pointer hover:border-accent/30 transition-colors duration-200">
        <div className="flex-1 min-w-0 text-foreground/80">
          {file ? (
            <>
              <div className="font-medium text-xs truncate" title={file.name}>{file.name}</div>
              <div className="text-[10px] text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </>
          ) : (
            <div className="text-xs text-muted truncate">Choose file…</div>
          )}
        </div>
        
        {/* ✅ REDESIGNED: Tinted text with solid dark mode fallback */}
        <div className="shrink-0 rounded-md bg-foreground text-background border border-foreground px-3 py-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer">
          Browse
        </div>
        <input type="file" accept={finalAccept} onChange={onFileChange} className="hidden" />
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy || !file}
          className="rounded-lg px-4 py-1.5 bg-foreground text-background border border-foreground text-xs font-bold hover:opacity-80 transition-all duration-200 shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        {ok && <span className="text-emerald-400 text-xs animate-pulse">{ok}</span>}
        {err && <span className="text-red-400 text-xs">{err}</span>}
      </div>
    </div>
  );
}