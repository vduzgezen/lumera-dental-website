// features/case-dashboard/components/CaseViewerTabs.tsx
"use client";
import { useEffect, useState, memo, useRef } from "react";
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
  isBridge,
  requiresStrictApproval
}: {
  caseId: string;
  role: Role;
  status: string;
  files: CaseFile[];
  toothCodes: string;
  isBridge: boolean;
  requiresStrictApproval?: boolean;
}) {
  const [tab, setTab] = useState<string>("scan");
  
  // Dropdown State for the Designs Group
  const [isDesignDropdownOpen, setIsDesignDropdownOpen] = useState(false);
  const designDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (designDropdownRef.current && !designDropdownRef.current.contains(e.target as Node)) {
        setIsDesignDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // --- DERIVE URLS ---
  const scanHtml = getFileUrl(files, "scan_html");
  const scan3D = getFileUrl(files, "scan");
  const designHtml = getFileUrl(files, "design_with_model_html");
  const designWithModel3D = getFileUrl(files, "design_with_model");
  const designOnly3D = getFileUrl(files, "design_only");

  const hasScanViewer = !!scanHtml || !!scan3D;
  const hasDesignViewer = !!designHtml || !!designWithModel3D;

  // --- GROUP 1: FIXED TABS ---
  const fixedTabs: { key: string; label: string; disabled: boolean }[] = [];
  fixedTabs.push({ key: "scan", label: "Scan", disabled: !hasScanViewer });

  if (hasDesignViewer) {
      fixedTabs.push({ key: "design_with_model", label: "Design + Model", disabled: false });
  }

  // --- GROUP 2: DESIGN TABS ---
  let hasAllDesigns = false;
  const designTabs: { key: string; label: string; disabled: boolean }[] = [];
  const teeth = toothCodes.split(",").map(t => t.trim()).filter(Boolean);

  if (designOnly3D) {
      designTabs.push({ key: "design_only", label: "Design", disabled: false });
      hasAllDesigns = true;
  }

  let allIndividualPresent = true;
  if (teeth.length > 0) {
      teeth.forEach(tooth => {
          const key = `design_stl_${tooth}`;
          const url = getFileUrl(files, key);
          if (url) {
              designTabs.push({ key, label: `Design #${tooth}`, disabled: false });
          } else {
              allIndividualPresent = false;
          }
      });
      if (!designOnly3D) hasAllDesigns = allIndividualPresent;
  } else if (!designOnly3D) {
      hasAllDesigns = false;
  }

  const genericToothlessDesign = getFileUrl(files, "design_stl_") || getFileUrl(files, "design_stl_undefined");
  if (genericToothlessDesign && !designOnly3D) {
      designTabs.push({ key: "design_stl_", label: "Appliance Design", disabled: false });
      hasAllDesigns = true;
  }

  // Check if current tab is one of the design tabs
  const isDesignDropdownActive = designTabs.some(d => d.key === tab);
  const activeDesignTab = designTabs.find(d => d.key === tab);

  // --- AUTO SELECT ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if the current tab exists in either group
    const isValid = fixedTabs.some(t => t.key === tab && !t.disabled) || designTabs.some(t => t.key === tab && !t.disabled);
    
    if (!isValid) {
       const firstEnabled = fixedTabs.find(t => !t.disabled) || designTabs.find(t => !t.disabled);
       if (firstEnabled) setTab(firstEnabled.key);
    }
  }, [fixedTabs, designTabs, tab]);

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
    if (tab === "design_only") return <Stable3D url={designOnly3D} />;
    if (tab.startsWith("design_stl_")) return <Stable3D url={getFileUrl(files, tab)} />;
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-background flex flex-col h-full overflow-hidden shadow-2xl">
      
      {/* ✅ ADDED relative and z-20 to ensure dropdown floats above 3D canvas */}
      <div className="flex items-center justify-between border-b border-border px-2 bg-surface h-14 shrink-0 pr-4 relative z-20">
        
        {/* TABS RENDERER */}
        {/* ✅ DYNAMIC OVERFLOW: When dropdown is open, remove overflow-x-auto to prevent clipping */}
        <div className={`flex items-center h-full ${isDesignDropdownOpen ? "overflow-visible" : "overflow-x-auto custom-scrollbar"}`}>
            
            {/* 1. FIXED TABS */}
            {fixedTabs.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => !t.disabled && selectTab(t.key)}
                  disabled={t.disabled}
                  className={`
                    px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap cursor-pointer
                    ${tab === t.key
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

            {/* 2. DESIGN TABS (Normal if 1, Dropdown if > 1) */}
            {designTabs.length === 1 && (
                <button
                    type="button"
                    onClick={() => !designTabs[0].disabled && selectTab(designTabs[0].key)}
                    disabled={designTabs[0].disabled}
                    className={`
                        px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap cursor-pointer
                        ${tab === designTabs[0].key
                            ? "border-[#9696e2] text-[#9696e2]" 
                            : designTabs[0].disabled
                            ? "border-transparent text-muted/30 !cursor-not-allowed"
                            : "border-transparent text-muted hover:text-foreground"
                        }
                    `}
                >
                    {designTabs[0].label}
                </button>
            )}

            {designTabs.length > 1 && (
                <div className="relative h-full flex items-center" ref={designDropdownRef}>
                    <button
                        onClick={() => setIsDesignDropdownOpen(!isDesignDropdownOpen)}
                        className={`
                            px-4 h-full text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer
                            ${isDesignDropdownActive
                                ? "border-[#9696e2] text-[#9696e2]" 
                                : "border-transparent text-muted hover:text-foreground"
                            }
                        `}
                    >
                        {isDesignDropdownActive ? activeDesignTab?.label : "Designs"}
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesignDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isDesignDropdownOpen && (
                        <div className="absolute top-[calc(100%+1px)] left-0 w-48 bg-surface border border-border rounded-b-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1 flex flex-col">
                                {designTabs.map(t => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => {
                                            if (!t.disabled) {
                                                selectTab(t.key);
                                                setIsDesignDropdownOpen(false);
                                            }
                                        }}
                                        disabled={t.disabled}
                                        className={`
                                            w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                                            ${tab === t.key 
                                                ? "bg-[var(--accent-dim)] text-accent font-semibold" 
                                                : t.disabled 
                                                ? "text-muted opacity-50 !cursor-not-allowed" 
                                                : "text-foreground hover:bg-surface-highlight hover:text-accent"
                                            }
                                        `}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* ACTIONS RENDERER */}
        <div className="ml-auto pl-4 shrink-0 z-50">
          <CaseActions 
            caseId={caseId} 
            role={role} 
            currentStatus={status as CaseStatus} 
            hasAllDesigns={hasAllDesigns}
            requiresStrictApproval={requiresStrictApproval}
          />
        </div>

      </div>

      <div className="flex-1 p-2 relative min-h-0 bg-background z-0">
        {renderContent()}
      </div>
    </div>
  );
}