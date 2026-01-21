// portal/components/CaseDetailSidebar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import HtmlViewerUploader from "@/components/HtmlViewerUploader";
import FileUploader from "@/components/FileUploader";
import CommentsPanel from "@/components/CommentsPanel";
import DesignerPicker from "@/components/DesignerPicker";
import { CaseFile } from "@prisma/client";

// Updated to include 'milling'
type Role = "customer" | "lab" | "admin" | "milling";

type Props = {
  caseId: string;
  role: Role;
  status: string;
  files: CaseFile[];
  comments: any[];
  events: any[];   
  isLabOrAdmin: boolean; // Note: We'll treat 'milling' as internal too for UI logic
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
  status,
  files,
  comments,
  events,
  isLabOrAdmin: _isLabOrAdmin, 
  currentUserName,
  designPreferences,
  assigneeId,
  designers = []
}: Props) {
  const STORAGE_KEY = "lumera.sidebarTab";
  const [activeTab, setActiveTab] = useState<"files" | "discussion" | "history" | "preferences">("discussion");

  // Treat Lab, Admin, and Milling as "Internal" users who get the advanced view
  const isInternal = role === "lab" || role === "admin" || role === "milling";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && ["files", "discussion", "history", "preferences"].includes(saved)) {
        setActiveTab(saved as any);
      } else {
        // Default based on role
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
      // Production Files
      rx: labels.has("rx_pdf"),
      construction: labels.has("construction_info"),
      modelTop: labels.has("model_top"),
      modelBottom: labels.has("model_bottom"),
    };
  }, [files]);

  // --- 1. DROPDOWN NAVIGATION (Admin/Lab/Milling) ---
  const InternalNav = () => (
    <div className="p-4 border-b border-white/10 bg-[#0a1020]">
      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
        View Section
      </label>
      <div className="relative">
        <select
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value as any)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white appearance-none focus:border-accent/50 outline-none cursor-pointer"
        >
          <option value="files">📂 Manage Files</option>
          <option value="discussion">💬 Discussion ({comments.length})</option>
          <option value="history">📜 History</option>
          <option value="preferences">⭐ Preferences</option>
        </select>
        {/* Chevron Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  // --- 2. TAB BUTTON NAVIGATION (Doctors) ---
  const CustomerNav = () => (
    <div className="flex border-b border-white/10 bg-[#0a1020]">
      <button
        onClick={() => handleTabChange("discussion")}
        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "discussion" ? "border-accent text-white" : "border-transparent text-white/60 hover:text-white"
        }`}
      >
        Discussion
      </button>
      <button
        onClick={() => handleTabChange("history")}
        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "history" ? "border-accent text-white" : "border-transparent text-white/60 hover:text-white"
        }`}
      >
        History
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/20 overflow-hidden shadow-2xl">
      
      {/* HEADER: Assignment (Admin Only) */}
      {role === "admin" && (
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Assigned Designer</div>
          <DesignerPicker caseId={caseId} currentAssigneeId={assigneeId || null} designers={designers} />
        </div>
      )}

      {/* NAVIGATION SWITCHER */}
      {isInternal ? <InternalNav /> : <CustomerNav />}

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-black/20">
        
        {/* === FILES TAB (Internal Only) === */}
        {isInternal && (
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "files" ? "block" : "hidden"}`}>
             <div className="space-y-8">
                
                {/* VISUALIZATION GROUP */}
                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-white/5 pb-1">Visualization</div>
                    
                    {/* Scan HTML */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-white/80">Scan HTML</span>
                            {fileStatus.scanHtml && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="scan_html" description="Exocad Web Viewer (Scan)" />
                    </div>

                    {/* Design HTML */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-white/80">Design HTML</span>
                            {fileStatus.designHtml && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="design_with_model_html" description="Exocad Web Viewer (Design)" />
                    </div>

                    {/* Design STL */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-white/80">Design STL</span>
                            {fileStatus.designOnly && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="design_only" description="Final Design STL" />
                    </div>
                </div>

                {/* PRODUCTION GROUP (New Slots) */}
                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-white/5 pb-1">Production</div>
                    
                    {/* Rx PDF */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-white/80">Rx PDF</span>
                             {fileStatus.rx && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="rx_pdf" accept=".pdf" description="Prescription PDF" />
                    </div>

                    {/* Construction Info */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-white/80">Construction Info</span>
                             {fileStatus.construction && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="construction_info" accept=".pdf,.xml,.txt" description="Construction/Milling Params" />
                    </div>

                    {/* Model Top */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-white/80">Model Top</span>
                             {fileStatus.modelTop && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="model_top" accept=".stl,.ply" description="Upper Model STL" />
                    </div>

                    {/* Model Bottom */}
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-white/80">Model Bottom</span>
                             {fileStatus.modelBottom && <span className="text-[10px] text-blue-300">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="model_bottom" accept=".stl,.ply" description="Lower Model STL" />
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* === DISCUSSION TAB (Always mounted, toggled via CSS) === */}
        <div className={`flex-1 flex flex-col min-h-0 p-4 animate-in fade-in duration-200 ${activeTab === "discussion" ? "flex" : "hidden"}`}>
             <CommentsPanel caseId={caseId} comments={comments} canPost={true} currentUserName={currentUserName} currentUserRole={role} />
        </div>

        {/* === HISTORY TAB === */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "history" ? "block" : "hidden"}`}>
            {events.length === 0 ? <p className="text-white/60 text-sm">No events yet.</p> : (
              <div className="relative border-l border-white/10 ml-2 space-y-6 pt-2">
                {events.map((ev) => (
                  <div key={ev.id} className="ml-4 relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-black" />
                    <div className="flex flex-col"><span className="text-sm font-medium text-white">{ev.to.replace(/_/g, " ")}</span><span className="text-xs text-white/40 font-mono mt-0.5">{fmtDate(ev.at)}</span></div>
                    {ev.note && <div className="mt-2 text-xs text-white/80 bg-white/5 p-2 rounded border border-white/5 italic">"{ev.note}"</div>}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* === PREFERENCES TAB (Internal Only) === */}
        {isInternal && (
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "preferences" ? "block" : "hidden"}`}>
            {designPreferences ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">Doctor Preferences</h4>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3"><p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{designPreferences}</p></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-20 text-white/30 text-sm italic">No preferences set for this case.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}