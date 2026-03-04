// portal/components/CopyableId.tsx
"use client";

import { useState } from "react";

type Props = {
  id: string;
  truncate?: boolean;
};

export default function CopyableId({ id, truncate = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent row clicks if nested
    e.stopPropagation();
    
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-[var(--accent-dim)] transition-colors cursor-pointer"
      title="Click to copy Case ID"
    >
      <code className="text-xs text-muted group-hover:text-foreground transition-colors font-mono">
        {truncate ? `${id.slice(-6)}...` : id}
      </code>
      
      {/* Visual Feedback */}
      {copied ? (
        <span className="text-[10px] text-green-400 font-medium animate-pulse">
          Copied
        </span>
      ) : (
        /* Hidden copy icon that appears on hover */
        <svg 
          className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}