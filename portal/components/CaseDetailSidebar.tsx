// components/CaseDetailSidebar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import HtmlViewerUploader from "@/features/case-dashboard/components/HtmlViewerUploader";
import FileUploader from "@/components/ui/FileUploader";
import CommentsPanel from "@/features/case-dashboard/components/CommentsPanel";
import DesignerPicker from "@/components/DesignerPicker";
import PreferencesTab from "@/features/case-dashboard/components/PreferencesTab";
import HistoryTab from "@/features/case-dashboard/components/HistoryTab"; // ✅ IMPORT NEW TAB
import { CaseFile } from "@prisma/client";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  role: Role;
  files: CaseFile[];
  comments: any[];
  events: any[];   
  currentUserName: string;
  doctorPreferences?: string | null;
  caseNotes?: string | null;
  assigneeId?: string | null;
  designers?: { id: string; name: string | null; email: string }[];
  toothCodes: string;
  isBridge: boolean;
  product: string; 
};

export default function CaseDetailSidebar({
  caseId,
  role,
  files,
  comments,
  events,
  currentUserName,
  doctorPreferences,
  caseNotes,
  assigneeId,
  designers = [],
  toothCodes,
  isBridge,
  product
}: Props) {
  const STORAGE_KEY = "lumera.sidebarTab";
  const isInternal = role === "lab" || role === "admin" || role === "milling";

  const [activeTab, setActiveTab] = useState<"files" | "discussion" | "history" | "preferences">(
    isInternal ? "files" : "discussion"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      
      if (!isInternal && (saved === "files" || saved === "preferences")) {
        setActiveTab("discussion");
        return;
      }

      if (saved && ["files", "discussion", "history", "preferences"].includes(saved)) {
        setActiveTab(saved as any);
      } else {
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
      designOnly: labels.has("design_only") || labels.has("design_stl_undefined") || labels.has("design_stl_"), 
      rx: labels.has("rx_pdf"),
      construction: labels.has("construction_info"),
      modelTop: labels.has("model_top"),
      modelBottom: labels.has("model_bottom"),
    };
  }, [files]);

  const teeth = useMemo(() => {
    return toothCodes.split(",").map(t => t.trim()).filter(Boolean);
  }, [toothCodes]);

  const isAppliance = (!isBridge && teeth.length === 0) || product.toUpperCase().includes("NIGHTGUARD");

  const InternalNav = () => (
    <div className="h-14 flex items-center px-3 border-b border-border bg-surface shrink-0 gap-3">
      <label className="text-xs font-bold text-accent uppercase tracking-wider shrink-0 hidden sm:block">
        View
      </label>
      <div className="relative flex-1">
        <select
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value as any)}
          className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-1.5 text-sm text-foreground appearance-none focus:border-accent/50 outline-none cursor-pointer transition-colors duration-200"
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
    <div className="flex flex-col h-full rounded-xl border border-border bg-background overflow-hidden shadow-2xl transition-colors duration-200">
      
      {role === "admin" && (
        <div className="p-3 border-b border-border bg-background transition-colors duration-200">
          <div className="flex items-center justify-between mb-1">
             <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Assigned Designer</div>
          </div>
          <DesignerPicker caseId={caseId} currentAssigneeId={assigneeId || null} designers={designers} />
        </div>
      )}

      {isInternal ? <InternalNav /> : <CustomerNav />}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background transition-colors duration-200">
        
        {/* FILES TAB */}
        {isInternal && (
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 ${activeTab === "files" ? "block" : "hidden"}`}>
             <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-border pb-1">Visualization</div>
                    
                    <div className="bg-surface p-3 rounded-lg border border-border transition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-medium text-foreground/80">Scan HTML</span>
                            {fileStatus.scanHtml && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="scan_html" description="Exocad Web Viewer (Scan)" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border transition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-medium text-foreground/80">Design HTML</span>
                            {fileStatus.designHtml && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <HtmlViewerUploader caseId={caseId} role={role} label="design_with_model_html" description="Exocad Web Viewer (Design)" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border transition-colors duration-200">
                        {isBridge || isAppliance ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-medium text-foreground/80">{isAppliance ? "Appliance Design (STL)" : "Bridge Design (STL)"}</span>
                                {fileStatus.designOnly && <span className="text-[10px] text-accent">✓ Ready</span>}
                            </div>
                            <FileUploader caseId={caseId} role={role} label="design_only" description={isAppliance ? "Appliance STL" : "Merged Bridge STL"} />
                          </div>
                        ) : (
                          <div className="space-y-4">
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Individual Designs</span>
                             </div>
                             {teeth.map((tooth) => {
                                const label = `design_stl_${tooth}`;
                                const hasFile = files.some(f => f.label === label);
                                return (
                                  <div key={tooth} className="pt-2 border-t border-border/50 first:border-0 first:pt-0">
                                      <div className="flex items-center justify-between mb-2">
                                         <span className="text-xs font-medium text-foreground/80">Tooth #{tooth}</span>
                                          {hasFile && <span className="text-[10px] text-accent">✓ Ready</span>}
                                      </div>
                                      <FileUploader caseId={caseId} role={role} label={label as any} description={`Design #${tooth} (STL)`} />
                                  </div>
                                );
                             })}
                             
                             {!isBridge && fileStatus.designOnly && !teeth.some(t => files.some(f => f.label === `design_stl_${t}`)) && (
                                <div className="mt-4 pt-4 border-t border-dashed border-border">
                                   <p className="text-[10px] text-amber-400 mb-2">Legacy Design File Found:</p>
                                   <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-foreground/80">Legacy STL</span>
                                        <span className="text-[10px] text-accent">✓ Ready</span>
                                   </div>
                                   <FileUploader caseId={caseId} role={role} label="design_only" description="Legacy Design STL" />
                                </div>
                             )}
                          </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider border-b border-border pb-1">Production</div>
                    
                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground/80">Rx PDF</span>
                             {fileStatus.rx && <span className="text-[10px] text-accent">✓ Ready</span>}
                        </div>
                        <FileUploader caseId={caseId} role={role} label="rx_pdf" accept=".pdf" description="Prescription PDF" />
                    </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2 transition-colors duration-200">
                         <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Construction Info</span>
                             {fileStatus.construction && <span className="text-[10px] text-accent">✓ Ready</span>}
                         </div>
                        <FileUploader caseId={caseId} role={role} label="construction_info" description="Construction/Milling Params" />
                     </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2 transition-colors duration-200">
                         <div className="flex items-center justify-between">
                             <span className="text-xs font-medium text-foreground/80">Model Top</span>
                             {fileStatus.modelTop && <span className="text-[10px] text-accent">✓ Ready</span>}
                         </div>
                        <FileUploader caseId={caseId} role={role} label="model_top" accept=".stl,.ply" description="Upper Model STL" />
                   </div>

                    <div className="bg-surface p-3 rounded-lg border border-border space-y-2 transition-colors duration-200">
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

        {/* DISCUSSION TAB */}
        <div className={`flex-1 flex flex-col min-h-0 p-4 animate-in fade-in duration-200 ${activeTab === "discussion" ? "flex" : "hidden"}`}>
             <CommentsPanel caseId={caseId} comments={comments} canPost={true} currentUserName={currentUserName} currentUserRole={role} />
        </div>

        {/* ✅ INJECTED HISTORY TAB */}
        <HistoryTab isActive={activeTab === "history"} events={events} />

        {/* PREFERENCES TAB */}
        {isInternal && (
           <PreferencesTab 
             isActive={activeTab === "preferences"}
             caseId={caseId}
             doctorPreferences={doctorPreferences}
             caseNotes={caseNotes}
             role={role}
           />
        )}
      </div>
    </div>
  );
}