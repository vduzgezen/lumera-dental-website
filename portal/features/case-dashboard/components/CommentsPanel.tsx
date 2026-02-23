// features/case-dashboard/components/CommentsPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
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
      const label = "Photo";

      const urlRes = await fetch(`/api/cases/${caseId}/files/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type,
          label: label
        }),
      });

      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await urlRes.json();

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");

      const upRes = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label: label,
          size: file.size,
          filename: file.name
        }),
      });

      if (!upRes.ok) throw new Error("Failed to save image record");
      const upData = await upRes.json();
      
      await handlePost(upData.id);
    } catch (e) {
      console.error(e);
      alert("Failed to upload annotation");
      setPosting(false);
    }
  }

  function renderBody(text: string) {
    const regex = /((?:https?:\/\/[^\s]+|(?:\/uploads\/)[^\s]+)\.(?:png|jpg|jpeg|gif|webp))/gi;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.match(regex)) {
        const safeSrc = fixUrl(part);
        return (
          <div key={i} className="my-3 relative w-full h-64">
            <Image
              src={safeSrc}
              alt="Inline Content"
              fill
              className="rounded-lg border border-border cursor-zoom-in object-contain"
              onClick={() => setZoomImg(safeSrc)}
              unoptimized
            />
          </div>
        );
      }
      if (!part) return null;
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0 transition-colors duration-200">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 flex-shrink-0">
        Discussion
      </h3>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 space-y-reverse pr-2 custom-scrollbar flex flex-col-reverse">
        {comments.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const isInternal = c.role === "admin" || c.role === "lab" || c.role === "milling";
            const maskAsLumera = currentUserRole === "customer" && isInternal;
            
            const displayAuthor = maskAsLumera ? "Lumera" : c.author;
            const displayInitials = maskAsLumera ? "L" : displayAuthor.substring(0, 2).toUpperCase();
            
            const bubbleStyle = isInternal 
              ? "shadow-sm bg-gray-300 border border-gray-400 text-foreground dark:bg-[#9696e2]/50 dark:border-[#9696e2]/70 dark:text-white"
              : "shadow-sm bg-gray-300 border border-gray-400 text-foreground dark:bg-[#FFA800]/50 dark:border-[#FFA800]/70 dark:text-white";

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
                    <span className="text-sm font-medium text-foreground">
                      {displayAuthor}
                      {!maskAsLumera && c.role !== "customer" && (
                        <span className="ml-2 text-[10px] opacity-50 uppercase border border-border px-1 rounded">{c.role}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(c.at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
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
                            className="relative w-24 h-24 rounded-lg overflow-hidden border border-border cursor-zoom-in hover:border-accent/30 transition-colors bg-surface"
                          >
                            <Image 
                              src={safeSrc} 
                              alt="Attachment" 
                              fill
                              className="object-cover" 
                              sizes="96px"
                              unoptimized 
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
        <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
          <div className="relative flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              // ✅ This explicit list guarantees every device allows screenshot selection
              accept="image/jpeg, image/png, image/webp, image/heic, .jpg, .jpeg, .png, .webp, .heic"
              className="hidden"
              onChange={onFileSelect}
            />
            
            {/* ✅ Consistent coloring for Attach Image button */}
            <button
               onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:bg-[var(--accent-dim)] transition-colors duration-200 shadow-sm cursor-pointer"
              title="Attach Image & Draw"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* ✅ Consistent coloring for Type Message container */}
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
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/30 transition-colors duration-200"
            />
            
            {/* ✅ Consistent coloring for Send Comment button */}
            <button
              onClick={() => handlePost()}
              disabled={posting || (!body.trim())}
              className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors duration-200 shadow-sm cursor-pointer disabled:cursor-not-allowed"
              title="Send Comment"
            >
              {posting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 transition-colors duration-200"
          onClick={() => setZoomImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={zoomImg} 
            alt="Zoomed" 
            className="max-w-full max-h-full rounded-lg shadow-2xl" 
          />
          <button className="absolute top-4 right-4 text-muted hover:text-foreground">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}