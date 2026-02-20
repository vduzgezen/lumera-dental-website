// features/case-dashboard/components/CaseViewerTabs.tsx
"use client";
import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import CaseActions from "./CaseActions";
import type { Role, CaseStatus } from "@/lib/types";
import { CaseFile } from "@prisma/client";

// Dynamic import for 3D Panel
const Case3DPanel = dynamic(() => import("./Case3DPanel"), {
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-background animate-pulse flex items-center justify-center text-muted text-sm">
      Loading 3D Viewer...
    </div>
  ),
});

// --- STABLE WRAPPERS ---
const areUrlsEqual = (prev: { url: string | null }, next: { url: string | null }) => {
  if (prev.url === next.url) return true;
  if (!prev.url || !next.url) return false;
  const prevBase = prev.url.split("?")[0];
  const nextBase = next.url.split("?")[0];
  return prevBase === nextBase;
};

const Stable3DComponent = ({ url }: { url: string | null }) => {
  return <Case3DPanel url={url} />;
};
const Stable3D = memo(Stable3DComponent, areUrlsEqual);
Stable3D.displayName = "Stable3D";

const StableIframeComponent = ({ url, title }: { url: string; title: string }) => {
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    try {
      const iframe = e.target as HTMLIFrameElement;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.body.style.backgroundColor = "var(--background)";
        const style = doc.createElement("style");
        style.textContent = `
          body, html { background-color: var(--background) !important;
          }
          #background { background-color: var(--background) !important;
          }
          .webviewer-canvas-container { background-color: var(--background) !important;
          }
        `;
        doc.head.appendChild(style);
      }
    } catch (err) {
      console.warn("Could not inject styles into viewer", err);
    }
  };

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden">
      <iframe 
        src={url} 
        className="w-full h-full border-0 block" 
        title={title}
        onLoad={handleIframeLoad} 
      />
    </div>
  );
};
const StableIframe = memo(StableIframeComponent, (prev, next) => areUrlsEqual({ url: prev.url }, { url: next.url }));
StableIframe.displayName = "StableIframe";

function getFileUrl(files: CaseFile[], label: string): string | null {
  const f = files.find(f => f.label === label);
  return f ? f.url : null;
}

export default function CaseViewerTabs({
  caseId,
  role,
  status,
  files,
  toothCodes,
  isBridge
}: {
  caseId: string;
  role: Role;
  status: string;
  files: CaseFile[];
  toothCodes: string;
  isBridge: boolean;
}) {
  const [tab, setTab] = useState<string>("scan");

  // --- DERIVE URLS ---
  const scanHtml = getFileUrl(files, "scan_html");
  const scan3D = getFileUrl(files, "scan");
  const designHtml = getFileUrl(files, "design_with_model_html");
  const designWithModel3D = getFileUrl(files, "design_with_model");
  const designOnly3D = getFileUrl(files, "design_only");

  const hasScanViewer = !!scanHtml || !!scan3D;
  const hasDesignViewer = !!designHtml || !!designWithModel3D;

  const tabs: { key: string; label: string; disabled: boolean }[] = [];

  // 1. Scan 
  tabs.push({ key: "scan", label: "Scan", disabled: !hasScanViewer });

  let hasAllDesigns = false;
  
  // ✅ FIX: Determine if it's an appliance (No Bridge AND No Teeth)
  const teeth = toothCodes.split(",").map(t => t.trim()).filter(Boolean);
  const isAppliance = !isBridge && teeth.length === 0;

  // 2. Design Tabs
  if (isBridge || isAppliance) {
     const hasSingleDesign = !!designOnly3D;
     if (hasSingleDesign) {
         tabs.push({ key: "design_only", label: "Design", disabled: false });
     }
     hasAllDesigns = hasSingleDesign;
  } else {
     let allIndividualPresent = true;
     
     teeth.forEach(tooth => {
         const key = `design_stl_${tooth}`;
         const url = getFileUrl(files, key);
         if (url) {
            tabs.push({ key, label: `Design #${tooth}`, disabled: false });
         } else {
            allIndividualPresent = false;
         }
     });

     if (tabs.length === 1 && designOnly3D) {
        tabs.push({ key: "design_only", label: "Design", disabled: false });
        hasAllDesigns = true;
     } else {
        hasAllDesigns = teeth.length > 0 && allIndividualPresent;
     }
  }

  // 3. Design + Model
  if (hasDesignViewer) {
      tabs.push({ key: "design_with_model", label: "Design + Model", disabled: false });
  }

  // --- AUTO SELECT ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentTabObj = tabs.find(t => t.key === tab);
    
    if (!currentTabObj || currentTabObj.disabled) {
       const firstEnabled = tabs.find(t => !t.disabled);
       if (firstEnabled) setTab(firstEnabled.key);
    }
  }, [tabs, tab]);

  function selectTab(key: string) {
    setTab(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lumera.caseViewerTab", key);
    }
  }

  const renderContent = () => {
    if (tab === "scan") {
      if (scanHtml) return <StableIframe url={scanHtml} title="Exocad Scan Viewer" />;
      return <Stable3D url={scan3D} />;
    }
    
    if (tab === "design_with_model") {
      if (designHtml) return <StableIframe url={designHtml} title="Exocad Design Viewer" />;
      return <Stable3D url={designWithModel3D} />;
    }
    
    if (tab === "design_only") {
      return <Stable3D url={designOnly3D} />;
    }

    if (tab.startsWith("design_stl_")) {
       const url = getFileUrl(files, tab);
       return <Stable3D url={url} />;
    }

    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-background flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="flex items-center border-b border-border px-2 bg-surface h-14 shrink-0 overflow-x-auto custom-scrollbar">
        {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => !t.disabled && selectTab(t.key)}
              disabled={t.disabled}
              className={`
                px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap cursor-pointer
                ${
                  tab === t.key
                    ? "border-[#9696e2] text-[#9696e2]" 
                    : t.disabled
                    ? "border-transparent text-muted/30 !cursor-not-allowed"
                    : "border-transparent text-muted hover:text-foreground"
                }
              `}
            >
              {t.label}
            </button>
        ))}
        
        <div className="ml-auto pr-2 pl-4">
          <CaseActions 
            caseId={caseId} 
            role={role} 
            currentStatus={status as CaseStatus} 
            hasAllDesigns={hasAllDesigns}
          />
        </div>
      </div>

      <div className="flex-1 p-2 relative min-h-0 bg-background">
        {renderContent()}
      </div>
    </div>
  );
}