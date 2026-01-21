// portal/components/CommentsPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ImageAnnotator from "./ImageAnnotator";

type Attachment = {
  id: string;
  url: string;
  kind: string;
};

type Comment = {
  id: string;
  body: string;
  at: Date | string;
  author: string;
  role: string;
  attachments?: Attachment[];
};

function fixUrl(url: string) {
  if (!url) return "";
  let clean = url.replace(/^public\//, "");
  if (!clean.startsWith("/")) clean = "/" + clean;
  return clean;
}

export default function CommentsPanel({
  caseId,
  comments: initialComments,
  canPost,
  currentUserName,
  currentUserRole,
}: {
  caseId: string;
  comments: Comment[];
  canPost: boolean;
  currentUserName: string;
  currentUserRole: string;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [annotatingFile, setAnnotatingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function handlePost(attachmentId?: string) {
    if (!body.trim() && !attachmentId) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          body: body || (attachmentId ? "Attached image" : ""),
          attachmentFileId: attachmentId 
        }),
      });
      if (!res.ok) throw new Error("Failed to post");

      const newComment = await res.json();
      const mapped: Comment = {
        id: newComment.id,
        body: newComment.body,
        at: new Date(newComment.createdAt),
        author: currentUserName,
        role: currentUserRole,
        attachments: newComment.attachments?.map((a: any) => ({
          id: a.id,
          url: a.url,
          kind: a.kind
        })) || []
      };

      setComments((prev) => [mapped, ...prev]);
      setBody("");
    } catch (e) {
      console.error(e);
      alert("Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnnotatingFile(file);
    e.target.value = "";
  }

  async function onAnnotationSave(blob: Blob) {
    setAnnotatingFile(null); 
    setPosting(true);
    try {
      const file = new File([blob], "annotation.png", { type: "image/png" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", "Photo"); 

      const upRes = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        body: fd,
      });
      if (!upRes.ok) throw new Error("Failed to upload annotation");
      const upData = await upRes.json();
      
      await handlePost(upData.id);
    } catch (e) {
      console.error(e);
      alert("Failed to upload annotation");
      setPosting(false);
    }
  }

  // --- NEW: Spacing & Inline Image Fix ---
  function renderBody(text: string) {
    const regex = /((?:https?:\/\/[^\s]+|(?:\/uploads\/)[^\s]+)\.(?:png|jpg|jpeg|gif|webp))/gi;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.match(regex)) {
        const safeSrc = fixUrl(part);
        return (
          // FIX: Standardized spacing (my-3)
          <div key={i} className="my-3">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt="Inline Content"
              className="block max-w-full rounded-lg border border-white/10 cursor-zoom-in"
              onClick={() => setZoomImg(safeSrc)}
            />
          </div>
        );
      }
      if (!part) return null;
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex-shrink-0">
        Discussion
      </h3>

      {/* FIX: Added space-y-reverse to handle bottom-up stacking correctly */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 space-y-reverse pr-2 custom-scrollbar flex flex-col-reverse">
        {comments.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const isInternal = c.role === "admin" || c.role === "lab" || c.role === "milling";
            const maskAsLumera = currentUserRole === "customer" && isInternal;
            
            const displayAuthor = maskAsLumera ? "Lumera" : c.author;
            const displayInitials = maskAsLumera ? "L" : displayAuthor.substring(0, 2).toUpperCase();
            
            const bubbleStyle = isInternal 
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";

            return (
              <div key={c.id} className="group flex gap-3">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${bubbleStyle}
                  `}
                >
                  {displayInitials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-white/90">
                      {displayAuthor}
                      {!maskAsLumera && c.role !== "customer" && (
                        <span className="ml-2 text-[10px] opacity-50 uppercase border border-white/20 px-1 rounded">{c.role}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {new Date(c.at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {renderBody(c.body)}
                  </div>

                  {c.attachments && c.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.attachments.map((att) => {
                        const safeSrc = fixUrl(att.url);
                        return (
                          <div 
                            key={att.id}
                            onClick={() => setZoomImg(safeSrc)} 
                            className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 cursor-zoom-in hover:border-white/30 transition-colors bg-black/50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={safeSrc} 
                              alt="Attachment" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerText = "⚠️ Error";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {canPost && (
        <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
          <div className="relative flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Attach Image & Draw"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            
            <button
              onClick={() => handlePost()}
              disabled={posting || (!body.trim())}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {annotatingFile && (
        <ImageAnnotator
          file={annotatingFile}
          onSave={onAnnotationSave}
          onCancel={() => setAnnotatingFile(null)}
        />
      )}

      {zoomImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setZoomImg(null)}
        >
          <img 
            src={zoomImg} 
            alt="Zoomed" 
            className="max-w-full max-h-full rounded-lg shadow-2xl" 
          />
          <button className="absolute top-4 right-4 text-white/50 hover:text-white">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}