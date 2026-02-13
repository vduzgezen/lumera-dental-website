// portal/components/CaseDetailSidebar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import HtmlViewerUploader from "@/components/HtmlViewerUploader";
import FileUploader from "@/components/FileUploader";
import CommentsPanel from "@/components/CommentsPanel";
import DesignerPicker from "@/components/DesignerPicker";
import { CaseFile } from "@prisma/client";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  role: Role;
  files: CaseFile[];
  comments: any[];
  events: any[];   
  currentUserName: string;
  designPreferences?: string | null;
  assigneeId?: string | null;
  designers?: { id: string; name: string | null; email: string }[];
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function CaseDetailSidebar({
  caseId,
  role,
  files,
  comments,
  events,
  currentUserName,
  designPreferences,
  assigneeId,
  designers = []
}: Props) {
  const STORAGE_KEY = "lumera.sidebarTab";
  
  const isInternal = role === "lab" || role === "admin" || role === "milling";

  // ✅ Initialize based on role to avoid flash of wrong content
  const [activeTab, setActiveTab] = useState<"files" | "discussion" | "history" | "preferences">(
    isInternal ? "files" : "discussion"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      
      // ✅ SAFETY CHECK: If doctor has "files" saved in local storage, force "discussion"
      if (!isInternal && (saved === "files" || saved === "preferences")) {
        setActiveTab("discussion");
        return;
      }

      if (saved && ["files", "discussion", "history", "preferences"].includes(saved)) {
        setActiveTab(saved as any);
      } else {
        // Default fallback if nothing saved
        setActiveTab(isInternal ? "files" : "discussion");
      }
    }
  }, [isInternal]);

  const handleTabChange = (tab: "files" | "discussion" | "history" | "preferences") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, tab);
    }
  };

  const fileStatus = useMemo(() => {
    const labels = new Set(files.map(f => f.label));
    return {
      scanHtml: labels.has("scan_html"),
      designHtml: labels.has("design_with_model_html"),
      designOnly: labels.has("design_only"),
      rx: labels.has("rx_pdf"),
      construction: labels.has("construction_info"),
      modelTop: labels.has("model_top"),
      modelBottom: labels.has("model_bottom"),
    };
  }, [files]);

  // ✅ UPDATED: Matches 3D Viewer Header Height (h-14) & Style
  const InternalNav = () => (
    <div className="h-14 flex items-center px-3 border-b border-border bg-surface shrink-0 gap-3">
      <label className="text-xs font-bold text-accent uppercase tracking-wider shrink-0 hidden sm:block">
        View
      </label>
      <div className="relative flex-1">
        <select
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value as any)}
          className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground appearance-none focus:border-accent/50 outline-none cursor-pointer"
        >
          <option value="files">📂 Files & Uploads</option>
          <option value="discussion">💬 Discussion ({comments.length})</option>
          <option value="history">📜 History</option>
          <option value="preferences">⭐ Preferences</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  // ✅ UPDATED: Matches 3D Viewer Header Height (h-14) & Style
  const CustomerNav = () => (
    <div className="h-14 flex items-center border-b border-border bg-surface shrink-0 px-2">
      <button
        onClick={() => handleTabChange("discussion")}
        className={`flex-1 h-full flex items-center justify-center text-sm font-medium border-b-2 transition-colors ${
          activeTab === "discussion" ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
        }`}
      >
        Discussion
      </button>
      <button
        onClick={() => handleTabChange("history")}
        className={`flex-1 h-full flex items-center justify-center text-sm font-medium border-b-2 transition-colors ${
          activeTab === "history" ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
        }`}
      >
        History
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-background overflow-hidden shadow-2xl">
      
      {role === "admin" && (
        <div className="p-3 border-b border-border bg-background">
          <div className="flex items-center justify-between mb-1">
             <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Assigned Designer</div>
          </div>
          <DesignerPicker caseId={caseId} currentAssigneeId={assigneeId || null} designers={designers} />
        </div>
      )}

      {isInternal ? <InternalNav /> : <CustomerNav />}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
        
        {isInternal && (
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "files" ? "block" : "hidden"}`}>
             <div className="space-y-8">
                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-border pb-1">Visualization</div>
                    
                    <div className="bg-surface p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-medium text-foreground/80">Scan HTML</span>
                            {fileStatus.scanHtml && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="scan_html" description="Exocad Web Viewer (Scan)" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-medium text-foreground/80">Design HTML</span>
                            {fileStatus.designHtml && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="design_with_model_html" description="Exocad Web Viewer (Design)" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-medium text-foreground/80">Design STL</span>
                            {fileStatus.designOnly && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="design_only" description="Final Design STL" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-border pb-1">Production</div>
                    
                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Rx PDF</span>
                             {fileStatus.rx && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="rx_pdf" accept=".pdf" description="Prescription PDF" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Construction Info</span>
                             {fileStatus.construction && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="construction_info" description="Construction/Milling Params" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Model Top</span>
                             {fileStatus.modelTop && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="model_top" accept=".stl,.ply" description="Upper Model STL" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Model Bottom</span>
                             {fileStatus.modelBottom && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="model_bottom" accept=".stl,.ply" description="Lower Model STL" />
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* ✅ DISCUSSION TAB (Default for Doctors) */}
        <div className={`flex-1 flex flex-col min-h-0 p-4 animate-in fade-in duration-200 ${activeTab === "discussion" ? "flex" : "hidden"}`}>
             <CommentsPanel caseId={caseId} comments={comments} canPost={true} currentUserName={currentUserName} currentUserRole={role} />
        </div>

        {/* HISTORY TAB */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "history" ? "block" : "hidden"}`}>
            {events.length === 0 ? <p className="text-muted text-sm">No events yet.</p> : (
              <div className="relative border-l border-border ml-2 space-y-6 pt-2">
                {events.map((ev) => (
                  <div key={ev.id} className="ml-4 relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border border-background" />
                    <div className="flex flex-col"><span className="text-sm font-medium text-foreground">{ev.to.replace(/_/g, " ")}</span><span className="text-xs text-muted font-mono mt-0.5">{fmtDate(ev.at)}</span></div>
                    {ev.note && <div className="mt-2 text-xs text-foreground/80 bg-surface p-2 rounded border border-border italic">&quot;{ev.note}&quot;</div>}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* PREFERENCES TAB (Internal Only) */}
        {isInternal && (
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "preferences" ? "block" : "hidden"}`}>
            {designPreferences ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Doctor Preferences</h4>
                <div className="bg-surface border border-border rounded-lg p-3"><p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{designPreferences}</p></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-20 text-muted text-sm italic">No preferences set for this case.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}