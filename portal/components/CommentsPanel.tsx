// components/CommentsPanel.tsx
"use client";

import { useState } from "react";

type Comment = {
  id: string;
  body: string;
  at: string | Date;
  author: string;
  role: string;
};

export default function CommentsPanel({
  caseId,
  comments,
  canPost,
}: {
  caseId: string;
  comments: Comment[];
  canPost: boolean;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to post");
      setBody("");
      location.reload();
    } catch (e: any) {
      setErr(e?.message || "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <h2 className="font-medium mb-3">Discussion</h2>

      {comments.length === 0 ? (
        <p className="text-white/60 mb-3">No comments yet.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-white/5 p-2">
              <div className="text-white/70 text-xs mb-1">
                {c.author} • {new Date(c.at).toLocaleString()} • {c.role}
              </div>
              <div>{c.body}</div>
            </li>
          ))}
        </ul>
      )}

      {canPost && (
        <div className="flex items-center gap-2">
          <input
            className="flex-1 px-3 py-1.5 rounded-md bg-white/10 border border-white/10 text-sm"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            className="px-3 py-1.5 rounded-md bg-white text-black text-sm disabled:opacity-60"
            disabled={busy || !body.trim()}
            onClick={submit}
          >
            Post
          </button>
        </div>
      )}
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
    </div>
  );
}
