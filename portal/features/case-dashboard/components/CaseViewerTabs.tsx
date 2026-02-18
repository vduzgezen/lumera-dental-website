// portal/components/CaseViewerTabs.tsx
"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import CaseActions from "./CaseActions";
import type { Role, CaseStatus } from "@/lib/types";

// Dynamic import for 3D Panel
const Case3DPanel = dynamic(() => import("./Case3DPanel"), {
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-background animate-pulse flex items-center justify-center text-muted text-sm">
      Loading 3D Viewer...
    </div>
  ),
});

type TabKey = "scan" | "design_with_model" | "design_only";

// --- STABLE WRAPPERS ---

const areUrlsEqual = (prev: { url: string | null }, next: { url: string | null }) => {
  if (prev.url === next.url) return true;
  if (!prev.url || !next.url) return false;
  const prevBase = prev.url.split("?")[0];
  const nextBase = next.url.split("?")[0];
  return prevBase === nextBase;
};

// 1. Stable 3D Panel
const Stable3DComponent = ({ url }: { url: string | null }) => {
  return <Case3DPanel url={url} />;
};
const Stable3D = memo(Stable3DComponent, areUrlsEqual);
// ✅ CRITICAL FIX: Explicit Display Name
Stable3D.displayName = "Stable3D";

// 2. Stable Iframe
const StableIframeComponent = ({ url, title }: { url: string; title: string }) => {
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    try {
      const iframe = e.target as HTMLIFrameElement;
      const doc = iframe.contentDocument;
      if (doc) {
        // Theme-aware background injection - uses CSS variable
        doc.body.style.backgroundColor = "var(--background)";
        const style = doc.createElement("style");
        style.textContent = `
          body, html { background-color: var(--background) !important; }
          #background { background-color: var(--background) !important; }
          .webviewer-canvas-container { background-color: var(--background) !important; }
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
// ✅ CRITICAL FIX: Explicit Display Name
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
            ? "border-transparent text-muted/30 cursor-not-allowed"
            : "border-transparent text-muted hover:text-foreground"
        }
      `}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (tab === "scan") {
      if (scanHtmlUrl) return <StableIframe url={scanHtmlUrl} title="Exocad Scan Viewer" />;
      return <Stable3D url={scan3DUrl} />;
    }
    if (tab === "design_with_model") {
      if (designHtmlUrl) return <StableIframe url={designHtmlUrl} title="Exocad Design Viewer" />;
      return <Stable3D url={designWithModel3DUrl} />;
    }
    return <Stable3D url={designOnly3DUrl} />;
  };

  return (
    <div className="rounded-xl border border-border bg-background flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="flex items-center border-b border-border px-2 bg-surface h-14 shrink-0">
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

      <div className="flex-1 p-2 relative min-h-0 bg-background">
        {renderContent()}
      </div>
    </div>
  );
}