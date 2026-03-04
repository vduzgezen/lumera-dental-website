// app/portal/cases/TriageBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  actionCount: number;
  unreadCount: number;
  shippedCount: number;
  isDoctor: boolean;
}

export default function TriageBar({ actionCount, unreadCount, shippedCount, isDoctor }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (actionCount === 0 && unreadCount === 0 && shippedCount === 0) {
    return (
      // ✅ Removed the box, unified the text size and removed italics
      <div className="flex items-center gap-2 animate-in fade-in duration-300">
        <span className="text-sm font-medium text-foreground shrink-0">Case Updates:</span>
        <span className="text-sm font-medium text-muted">All caught up ✓</span>
      </div>
    );
  }

  // Read current URL state
  const activeStatuses = searchParams.getAll("status");
  const isShippedActive = activeStatuses.includes("SHIPPED");
  const isUnreadActive = searchParams.get("unread") === "true";
  const isActionActive = searchParams.get("action") === "true";

  const handleTriageClick = (type: "ACTION" | "UNREAD" | "SHIPPED") => {
    const params = new URLSearchParams(searchParams.toString());
    const wasActionActive = isActionActive;
    const wasShippedActive = isShippedActive;
    const wasUnreadActive = isUnreadActive;

    params.delete("status");
    params.delete("unread");
    params.delete("action");

    if (type === "SHIPPED" && !wasShippedActive) {
      params.append("status", "SHIPPED");
    } else if (type === "ACTION" && !wasActionActive) {
      params.set("action", "true");
    } else if (type === "UNREAD" && !wasUnreadActive) {
      params.set("unread", "true");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const btnBase = "flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none text-foreground";

  const actionClass = isActionActive 
    ? "border-red-500 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
    : "border-border bg-surface hover:border-red-500/50";

  const unreadClass = isUnreadActive 
    ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
    : "border-border bg-surface hover:border-emerald-500/50";

  const shippedClass = isShippedActive 
    ? "border-blue-500 bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.2)]" 
    : "border-border bg-surface hover:border-blue-500/50";

  return (
    // ✅ Removed the outer box (border, bg, padding) completely
    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
      <span className="text-sm font-medium text-foreground shrink-0">Case Updates:</span>
      
      <div className="flex items-center gap-2">
          {actionCount > 0 && (
            <button onClick={() => handleTriageClick("ACTION")} className={`${btnBase} ${actionClass}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {actionCount} Action Required
            </button>
          )}

          {unreadCount > 0 && (
             <button onClick={() => handleTriageClick("UNREAD")} className={`${btnBase} ${unreadClass}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {unreadCount} Unread
            </button>
          )}

          {shippedCount > 0 && (
            <button onClick={() => handleTriageClick("SHIPPED")} className={`${btnBase} ${shippedClass}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {shippedCount} Shipped
            </button>
          )}
      </div>
    </div>
  );
}