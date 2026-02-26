// components/CaseNotesEditor.tsx
"use client";
import { useState, useEffect } from "react";

export default function CaseNotesEditor({
  caseId,
  initialNotes,
  role
}: {
  caseId: string;
  initialNotes: string | null;
  role: string;
}) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [savedStatus, setSavedStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");

  const canEdit = role === "lab" || role === "admin" || role === "milling";

  // Auto-Save Effect
  useEffect(() => {
    if (notes === (initialNotes || "")) return;

    setSavedStatus("Saving...");
    
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        if (!res.ok) throw new Error("Failed");
        setSavedStatus("Saved");
      } catch (e) {
        setSavedStatus("Error");
      }
    }, 800); 

    return () => clearTimeout(handler);
  }, [notes, caseId, initialNotes]);

  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex items-center justify-between shrink-0">
         <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Production / Designer Notes</h4>
         {canEdit && notes !== (initialNotes || "") && (
           <span className={`text-[10px] font-medium uppercase tracking-wider transition-colors duration-300 ${
             savedStatus === "Error" ? "text-red-400" : 
             savedStatus === "Saved" ? "text-emerald-500" : 
             "text-muted"
           }`}>
             {savedStatus}
           </span>
         )}
      </div>
      
      {canEdit ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter production notes here (e.g., thickness warnings, reduction requests). These will print on the Order Ticket..."
          // ✅ FIX: Static slate-400 placeholder completely bypasses WebKit repaint bugs while remaining visible on both themes.
          className="flex-1 w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground placeholder:text-slate-400 focus:border-accent/50 outline-none transition-colors duration-200 resize-none custom-scrollbar shadow-sm"
        />
      ) : (
        <div className="flex-1 bg-transparent border border-border p-4 rounded-lg text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed overflow-y-auto custom-scrollbar transition-colors duration-200">
          {notes || <span className="text-muted italic">No production notes provided for this case.</span>}
        </div>
      )}
    </div>
  );
}