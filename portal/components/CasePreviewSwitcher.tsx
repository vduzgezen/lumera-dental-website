// portal/components/CaseViewerTabs.tsx
"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import CaseActions from "@/components/CaseActions";
import type { Role, CaseStatus } from "@/lib/types";

// Dynamic import for 3D Panel
const Case3DPanel = dynamic(() => import("@/components/Case3DPanel"), {
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-[#0a1020] animate-pulse flex items-center justify-center text-white/30 text-sm">
      Loading 3D Viewer...
    </div>
  ),
});

type TabKey = "scan" | "design_with_model" | "design_only";

// --- STABLE WRAPPERS (Prevent Reloads on AutoRefresh) ---

// Helper: Check if URLs point to the same file (ignoring ?signature=...)
const areUrlsEqual = (prev: { url: string | null }, next: { url: string | null }) => {
  if (prev.url === next.url) return true; // Exact match
  if (!prev.url || !next.url) return false; // One is missing
  
  // Compare only the base path (e.g. https://bucket/file.stl)
  const prevBase = prev.url.split("?")[0];
  const nextBase = next.url.split("?")[0];
  return prevBase === nextBase;
};

// 1. Stable 3D Panel
const Stable3D = memo(({ url }: { url: string | null }) => {
  return <Case3DPanel url={url} />;
}, areUrlsEqual);

// ✅ FIX: Add display name
Stable3D.displayName = "Stable3D";

// 2. Stable Iframe (Exocad)
const StableIframe = memo(({ url, title }: { url: string; title: string }) => {
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    try {
      const iframe = e.target as HTMLIFrameElement;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.body.style.backgroundColor = "#0a1020";
        const style = doc.createElement("style");
        style.textContent = `
          body, html { background-color: #0a1020 !important; }
          #background { background-color: #0a1020 !important; }
          .webviewer-canvas-container { background-color: #0a1020 !important; }
        `;
        doc.head.appendChild(style);
      }
    } catch (err) {
      console.warn("Could not inject styles into viewer (Cross-Origin blocking?)", err);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a1020] rounded-lg overflow-hidden">
      <iframe 
        src={url} 
        className="w-full h-full border-0 block" 
        title={title}
        onLoad={handleIframeLoad} 
      />
    </div>
  );
}, (prev, next) => areUrlsEqual({ url: prev.url }, { url: next.url }));

// ✅ FIX: Add display name
StableIframe.displayName = "StableIframe";


export default function CaseViewerTabs({
  caseId,
  role,
  status,
  scan3DUrl,
  designWithModel3DUrl,
  designOnly3DUrl,
  scanHtmlUrl,
  designHtmlUrl,
}: {
  caseId: string;
  role: Role;
  status: string;
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
            ? "border-accent text-accent" 
            : disabled
            ? "border-transparent text-white/20 cursor-not-allowed"
            : "border-transparent text-white/60 hover:text-white"
        }
      `}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (tab === "scan") {
      if (scanHtmlUrl) {
        return <StableIframe url={scanHtmlUrl} title="Exocad Scan Viewer" />;
      }
      return <Stable3D url={scan3DUrl} />;
    }

    if (tab === "design_with_model") {
      if (designHtmlUrl) {
        return <StableIframe url={designHtmlUrl} title="Exocad Design Viewer" />;
      }
      return <Stable3D url={designWithModel3DUrl} />;
    }

    return <Stable3D url={designOnly3DUrl} />;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1020] flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="flex items-center border-b border-white/10 px-2 bg-white/5 h-14 shrink-0">
        {tabBtn("scan", "Scan", tab === "scan", !hasScanViewer)}
        {tabBtn("design_with_model", "Design + Model", tab === "design_with_model", !hasDesignViewer)}
        {tabBtn("design_only", "Design Only", tab === "design_only", !hasDesignOnlyViewer)}
        
        <div className="ml-auto pr-2">
          <CaseActions 
            caseId={caseId} 
            role={role} 
            currentStatus={status as CaseStatus} 
          />
        </div>
      </div>

      <div className="flex-1 p-2 relative min-h-0 bg-[#0a1020]">
        {renderContent()}
      </div>
    </div>
  );
}