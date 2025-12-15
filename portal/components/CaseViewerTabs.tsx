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

  // 🔁 Remember last selected tab across refreshes/uploads
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

    // If we have a stored tab and it's still valid for this case, use it.
    if (stored && available[stored]) {
      if (stored !== tab) {
        setTab(stored);
      }
      return;
    }

    // If current tab is valid, keep it.
    if (available[tab]) return;

    // Otherwise, pick the first available tab in priority order.
    for (const key of order) {
      if (available[key]) {
        setTab(key);
        window.localStorage.setItem(STORAGE_KEY, key);
        return;
      }
    }
    // If no viewers at all, leave default "scan".
  }, [hasScanViewer, hasDesignViewer, hasDesignOnlyViewer, tab]);

  function selectTab(key: TabKey) {
    const available: Record<TabKey, boolean> = {
      scan: hasScanViewer,
      design_with_model: hasDesignViewer,
      design_only: hasDesignOnlyViewer,
    };
    if (!available[key]) return;

    setTab(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lumera.caseViewerTab", key);
    }
  }

  function renderContent() {
    if (tab === "scan") {
      if (scanHtmlUrl) {
        return (
          <div className="rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Scan Viewer (Exocad)</h2>
            </div>
            <div className="flex-1 h-80 rounded-lg overflow-hidden bg-black/30">
              <iframe src={scanHtmlUrl} className="w-full h-full border-0" />
            </div>
          </div>
        );
      }
      if (scan3DUrl) {
        return <Case3DPanel url={scan3DUrl} />;
      }
      return (
        <div className="rounded-xl border border-white/10 p-4 h-full flex items-center justify-center text-sm text-white/60">
          No scan viewer or 3D file available.
        </div>
      );
    }

    if (tab === "design_with_model") {
      if (designHtmlUrl) {
        return (
          <div className="rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Design + Model Viewer (Exocad)</h2>
            </div>
            <div className="flex-1 h-80 rounded-lg overflow-hidden bg-black/30">
              <iframe src={designHtmlUrl} className="w-full h-full border-0" />
            </div>
          </div>
        );
      }
      if (designWithModel3DUrl) {
        return <Case3DPanel url={designWithModel3DUrl} />;
      }
      return (
        <div className="rounded-xl border border-white/10 p-4 h-full flex items-center justify-center text-sm text-white/60">
          No design + model viewer or 3D file available.
        </div>
      );
    }

    // design_only
    if (designOnly3DUrl) {
      return <Case3DPanel url={designOnly3DUrl} />;
    }
    return (
      <div className="rounded-xl border border-white/10 p-4 h-full flex items-center justify-center text-sm text-white/60">
        No design-only 3D file available.
      </div>
    );
  }

  const tabClass = (key: TabKey, enabled: boolean) =>
    [
      "px-3 py-1.5 text-xs sm:text-sm rounded-full",
      enabled
        ? tab === key
          ? "bg-white text-black"
          : "text-white/80 hover:bg-white/10"
        : "text-white/30 cursor-not-allowed",
    ].join(" ");

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="inline-flex rounded-full bg-black/40 border border-white/10 p-1 self-start">
        <button
          type="button"
          className={tabClass("scan", hasScanViewer)}
          onClick={() => selectTab("scan")}
          disabled={!hasScanViewer}
        >
          Scan
        </button>
        <button
          type="button"
          className={tabClass("design_with_model", hasDesignViewer)}
          onClick={() => selectTab("design_with_model")}
          disabled={!hasDesignViewer}
        >
          Design + Model
        </button>
        <button
          type="button"
          className={tabClass("design_only", hasDesignOnlyViewer)}
          onClick={() => selectTab("design_only")}
          disabled={!hasDesignOnlyViewer}
        >
          Design Only
        </button>
      </div>

      <div className="flex-1 min-h-[18rem]">{renderContent()}</div>
    </div>
  );
}
