// portal/components/CaseViewerTabs.tsx
"use client";

import { useEffect, useState } from "react";
import Case3DPanel from "@/components/Case3DPanel";

type TabKey = "scan" | "design_with_model" | "design_only";

export default function CaseViewerTabs({
  scan3DUrl,
  designWithModel3DUrl,
  designOnly3DUrl,
  scanHtmlUrl,
  designHtmlUrl,
}: {
  scan3DUrl: string | null;
  designWithModel3DUrl: string | null;
  designOnly3DUrl: string | null;
  scanHtmlUrl: string | null;
  designHtmlUrl: string | null;
}) {
  const [tab, setTab] = useState<TabKey>("scan");

  const hasScanViewer = !!scanHtmlUrl || !!scan3DUrl;
  const hasDesignViewer = !!designHtmlUrl || !!designWithModel3DUrl;
  const hasDesignOnlyViewer = !!designOnly3DUrl;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const STORAGE_KEY = "lumera.caseViewerTab";
    const stored = window.localStorage.getItem(STORAGE_KEY) as TabKey | null;

    const available: Record<TabKey, boolean> = {
      scan: hasScanViewer,
      design_with_model: hasDesignViewer,
      design_only: hasDesignOnlyViewer,
    };
    const order: TabKey[] = ["scan", "design_with_model", "design_only"];

    if (stored && available[stored]) {
      if (stored !== tab) setTab(stored);
      return;
    }
    if (available[tab]) return;
    for (const key of order) {
      if (available[key]) {
        setTab(key);
        window.localStorage.setItem(STORAGE_KEY, key);
        return;
      }
    }
  }, [hasScanViewer, hasDesignViewer, hasDesignOnlyViewer, tab]);

  function selectTab(key: TabKey) {
    setTab(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lumera.caseViewerTab", key);
    }
  }

  const tabBtn = (key: TabKey, label: string, active: boolean, disabled: boolean) => (
    <button
      type="button"
      onClick={() => !disabled && selectTab(key)}
      disabled={disabled}
      className={`
        px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center
        ${
          active
            ? "border-white text-white"
            : disabled
            ? "border-transparent text-white/20 cursor-not-allowed"
            : "border-transparent text-white/60 hover:text-white/80"
        }
      `}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (tab === "scan") {
      if (scanHtmlUrl) {
        return (
          <div className="w-full h-full bg-black/30 rounded-lg overflow-hidden">
             <iframe 
               src={scanHtmlUrl} 
               className="w-full h-full border-0 block" 
               title="Exocad Scan Viewer"
             />
          </div>
        );
      }
      return <Case3DPanel url={scan3DUrl} />;
    }

    if (tab === "design_with_model") {
      if (designHtmlUrl) {
        return (
          <div className="w-full h-full bg-black/30 rounded-lg overflow-hidden">
             <iframe 
               src={designHtmlUrl} 
               className="w-full h-full border-0 block" 
               title="Exocad Design Viewer"
             />
          </div>
        );
      }
      return <Case3DPanel url={designWithModel3DUrl} />;
    }

    return <Case3DPanel url={designOnly3DUrl} />;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 flex flex-col h-full min-h-[75vh]">
      {/* FIX: Added h-14 to force exact height alignment */}
      <div className="flex items-center border-b border-white/10 px-2 bg-white/5 h-14">
        {tabBtn("scan", "Scan", tab === "scan", !hasScanViewer)}
        {tabBtn("design_with_model", "Design + Model", tab === "design_with_model", !hasDesignViewer)}
        {tabBtn("design_only", "Design Only", tab === "design_only", !hasDesignOnlyViewer)}
      </div>

      <div className="flex-1 p-2 relative">
        {renderContent()}
      </div>
    </div>
  );
}