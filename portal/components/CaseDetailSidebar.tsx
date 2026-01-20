// portal/components/CaseDetailSidebar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import HtmlViewerUploader from "@/components/HtmlViewerUploader";
import FileUploader from "@/components/FileUploader";
import CommentsPanel from "@/components/CommentsPanel";
import { CaseFile } from "@prisma/client";

type CaseStatus = "IN_DESIGN" | "CHANGES_REQUESTED" | "APPROVED" | "IN_MILLING" | "SHIPPED" | "COMPLETED";

type Props = {
  caseId: string;
  role: "customer" | "lab" | "admin";
  status: string;
  files: CaseFile[];
  comments: any[];
  events: any[];   
  isLabOrAdmin: boolean;
  currentUserName: string;
  designPreferences?: string | null;
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function normalizeSlot(label: string | null): string {
  const lower = String(label ?? "").toLowerCase();
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") return "design_with_model";
  if (lower === "design_only") return "design_only";
  return "other";
}

export default function CaseDetailSidebar({
  caseId,
  role,
  status,
  files,
  comments,
  events,
  isLabOrAdmin,
  currentUserName,
  designPreferences,
}: Props) {
  const STORAGE_KEY = "lumera.sidebarTab";
  const [activeTab, setActiveTab] = useState<"files" | "discussion" | "history" | "preferences" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && ["files", "discussion", "history", "preferences"].includes(saved)) {
        setActiveTab(saved as any);
      } else {
        setActiveTab("discussion");
      }
    }
  }, []);

  const handleTabChange = (tab: "files" | "discussion" | "history" | "preferences") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, tab);
    }
  };

  const fileStatus = useMemo(() => {
    let scanHtml = false;
    let designHtml = false;
    let designOnly = false;

    for (const f of files) {
      const lbl = String(f.label ?? "").toLowerCase();
      const slot = normalizeSlot(lbl);
      if (lbl === "scan_html") scanHtml = true;
      if (lbl === "design_with_model_html") designHtml = true;
      if (slot === "design_only") designOnly = true;
    }
    return { scanHtml, designHtml, designOnly };
  }, [files]);

  const TabHeader = ({ 
    id, 
    label, 
    badge 
  }: { 
    id: "files" | "discussion" | "history" | "preferences"; 
    label: string; 
    badge?: React.ReactNode; 
  }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => handleTabChange(id)}
        className={`
          flex items-center justify-between w-full p-4 text-left transition-colors select-none border-b border-white/5
          ${isActive ? "bg-white/10 text-white" : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"}
        `}
      >
        <span className="font-medium flex items-center gap-2">
          {label}
          {badge}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isActive ? "rotate-180 text-white" : "text-white/40"}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };

  if (!activeTab) {
    return (
      <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden shadow-2xl animate-pulse">
        <div className="h-14 border-b border-white/5 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden shadow-2xl">
      
      {/* SCROLLABLE AREA START */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {isLabOrAdmin && (
          <>
            <TabHeader id="files" label="📂 Manage Files" />
            {activeTab === "files" && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/20 min-h-0 animate-in slide-in-from-top-2 duration-200">
                 <div className="space-y-4 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/80">Scan</span>
                        {fileStatus.scanHtml && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                      </div>
                      <div className="bg-black/40 p-2 rounded border border-white/5">
                        <HtmlViewerUploader caseId={caseId} role={role} label="scan_html" description="" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/80">Design + Model</span>
                        {fileStatus.designHtml && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                      </div>
                      <div className="bg-black/40 p-2 rounded border border-white/5">
                        <HtmlViewerUploader caseId={caseId} role={role} label="design_with_model_html" description="" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/80">Design Only (3D)</span>
                        {fileStatus.designOnly && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                      </div>
                      <div className="bg-black/40 p-2 rounded border border-white/5">
                        <FileUploader caseId={caseId} role={role} slot="design_only" />
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </>
        )}

        <TabHeader 
          id="discussion" 
          label="💬 Discussion" 
          badge={comments.length > 0 && activeTab !== 'discussion' ? <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{comments.length}</span> : null} 
        />
        {activeTab === "discussion" && (
          <div className="flex-1 flex flex-col min-h-0 bg-black/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex-1 min-h-0 p-4">
               <CommentsPanel 
                  caseId={caseId}
                  comments={comments}
                  canPost={true}
                  currentUserName={currentUserName}
                  currentUserRole={role} 
               />
            </div>
          </div>
        )}

        <TabHeader id="history" label="📜 History" />
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/20 min-h-0 animate-in slide-in-from-top-2 duration-200">
            {events.length === 0 ? (
              <p className="text-white/60 text-sm">No events yet.</p>
            ) : (
              <div className="relative border-l border-white/10 ml-2 space-y-6 pt-2">
                {events.map((ev) => (
                  <div key={ev.id} className="ml-4 relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-black" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {ev.to.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-white/40 font-mono mt-0.5">
                        {fmtDate(ev.at)}
                      </span>
                    </div>
                    {ev.note && (
                      <div className="mt-2 text-xs text-white/80 bg-white/5 p-2 rounded border border-white/5 italic">
                        "{ev.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- NEW PREFERENCES TAB (Collapsible) --- */}
        {isLabOrAdmin && (
          <>
            <TabHeader 
              id="preferences" 
              label="⭐ Preferences" 
              badge={designPreferences ? <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full">!</span> : null} 
            />
            {activeTab === "preferences" && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/20 min-h-0 animate-in slide-in-from-top-2 duration-200">
                {designPreferences ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">Doctor Preferences</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {designPreferences}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-20 text-white/30 text-sm italic">
                    No preferences set for this case.
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
      {/* SCROLLABLE AREA END */}
    </div>
  );
}