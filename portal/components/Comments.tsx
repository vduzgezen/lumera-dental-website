// portal/components/Comments.tsx
"use client";

import { useEffect, useState } from "react";

// Helper to detect if a line is an image URL
function extractImage(body: string) {
  const imgRegex = /(https?:\/\/[^\s]+|\/uploads\/[^\s]+)\.(jpg|jpeg|png|gif|webp)/i;
  const match = body.match(imgRegex);
  
  if (match) {
    return {
      imageUrl: match[0],
      text: body.replace(match[0], "").trim(),
    };
  }
  return { imageUrl: null, text: body };
}

export default function Comments({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      const r = await fetch(`/api/cases/${caseId}/comments`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load comments");
      setItems(j.comments ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    setError(undefined);
    try {
      const r = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Failed to post");
      setBody("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [caseId]);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-muted text-sm">Loading comments…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-muted text-sm">No comments yet.</p>}
          {items.map((c) => {
            const { imageUrl, text } = extractImage(c.body);
            return (
              <div key={c.id} className="rounded-lg border border-border p-3 bg-surface-highlight">
                <div className="text-[10px] uppercase tracking-wide text-muted/60 mb-2">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
                
                {imageUrl && (
                  <div className="mb-2 rounded overflow-hidden border border-border bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imageUrl} 
                      alt="Attachment" 
                      className="max-w-full h-auto object-contain max-h-60"
                    />
                  </div>
                )}
                
                {text && <div className="whitespace-pre-wrap text-sm text-foreground/90">{text}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 items-start pt-2 border-t border-border">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-lg p-2 bg-surface-highlight border border-border text-foreground text-sm focus:border-accent/50 outline-none transition"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && post()}
        />
        <button
          onClick={post}
          disabled={posting || !body.trim()}
          className="rounded-lg px-3 py-2 bg-accent text-white text-sm font-medium disabled:opacity-50 hover:bg-accent/80 transition"
        >
          {posting ? "..." : "Post"}
        </button>
      </div>
    </div>
  );
}