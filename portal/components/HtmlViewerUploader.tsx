// components/HtmlViewerUploader.tsx
"use client";

import { useState } from "react";

type Role = "customer" | "lab" | "admin" | "milling";

export default function HtmlViewerUploader({
  caseId,
  role,
  label,
  description,
}: {
  caseId: string;
  role: Role;
  label: "scan_html" | "design_with_model_html";
  description: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);

  // Customers cannot upload viewers
  if (role === "customer") return null;

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
      // 1. Get Permission (Presigned URL)
      const urlRes = await fetch(`/api/cases/${caseId}/files/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type || "text/html",
          label: label
        }),
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload permission");
      const { url, key } = await urlRes.json();

      // 2. Upload Direct to Cloud
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "text/html" },
      });

      if (!uploadRes.ok) throw new Error("Upload to cloud failed");

      // 3. Save Record to DB
      const dbRes = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label: label,
          size: file.size,
          filename: file.name
        }),
      });

      if (!dbRes.ok) throw new Error("Failed to save record");

      setOk("Viewer uploaded.");
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
      <div className="text-xs text-muted">{description}</div>

      <label className="flex items-center justify-between gap-3 rounded-lg p-2 bg-surface-highlight border border-border cursor-pointer hover:border-accent/30 transition-colors">
        <div className="flex-1 min-w-0 text-foreground/80">
          {file ? (
            <>
              <div className="font-medium text-xs truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-[10px] text-muted">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </>
          ) : (
            <div className="text-xs text-muted truncate">
              Choose Exocad HTML…
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-md bg-accent text-white px-3 py-1.5 text-xs font-medium">
          Browse
        </div>
        <input
          type="file"
          accept=".html,text/html"
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy || !file}
          className="rounded-lg px-3 py-1.5 bg-accent text-white text-xs font-bold disabled:opacity-50 hover:bg-accent/80 transition-colors"
        >
          {busy ? "Uploading…" : "Upload viewer"}
        </button>
        {ok && <span className="text-emerald-400 text-xs animate-pulse">{ok}</span>}
        {err && <span className="text-red-400 text-xs">{err}</span>}
      </div>
    </div>
  );
}