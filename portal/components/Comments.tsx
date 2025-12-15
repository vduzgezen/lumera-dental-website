"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-3">
      {loading ? (
        <p className="text-white/60 text-sm">Loading comments…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-white/60">No comments yet.</p>}
          {items.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 p-3">
              <div className="text-xs text-white/50">
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">{c.body}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-lg p-2 bg-black/40 border border-white/10 text-white"
        />
        <button
          onClick={post}
          disabled={posting || !body.trim()}
          className="rounded-lg px-3 py-2 bg-white text-black disabled:opacity-60"
        >
          {posting ? "Posting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
