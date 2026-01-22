// portal/components/CasePreviewSwitcher.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic"; // <--- 1. Import dynamic

// <--- 2. Lazy Load
const Case3DPanel = dynamic(() => import("@/components/Case3DPanel"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/10 animate-pulse" />,
});

type SlotKey = "scan" | "design_with_model" | "design_only";

const SLOT_LABEL: Record<SlotKey, string> = {
  scan: "Scan",
  design_with_model: "Design + Model",
  design_only: "Design Only",
};

export default function CasePreviewSwitcher({
  scanUrl,
  designWithModelUrl,
  designOnlyUrl,
}: {
  scanUrl?: string | null;
  designWithModelUrl?: string | null;
  designOnlyUrl?: string | null;
}) {
  const slotUrls = useMemo(() => ({
    scan: scanUrl,
    design_with_model: designWithModelUrl,
    design_only: designOnlyUrl,
  }), [scanUrl, designWithModelUrl, designOnlyUrl]);

  const [selected, setSelected] = useState<SlotKey>("scan");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("lumera.casePreviewSlot") as SlotKey | null;
    const order: SlotKey[] = ["design_with_model", "design_only", "scan"];

    if (stored && slotUrls[stored]) {
      setSelected(stored);
      return;
    }

    for (const key of order) {
      if (slotUrls[key]) {
        setSelected(key);
        return;
      }
    }

    setSelected("scan");
  }, [slotUrls]);

  const activeUrl = useMemo(
    () => slotUrls[selected] ?? null,
    [slotUrls, selected],
  );

  function handleSelect(key: SlotKey) {
    if (!slotUrls[key]) return;
    setSelected(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lumera.casePreviewSlot", key);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-medium">
          3D Preview
          {activeUrl ? (
            <span className="ml-2 text-xs text-white/60">
              ({SLOT_LABEL[selected]})
            </span>
          ) : null}
        </h2>
        <div className="inline-flex rounded-full bg-black/40 border border-white/10 overflow-hidden">
          {(Object.keys(slotUrls) as SlotKey[]).map((key) => {
            const enabled = !!slotUrls[key];
            return (
              <button
                key={key}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && handleSelect(key)}
                className={[
                  "px-3 py-1 text-xs sm:text-sm",
                  "transition-colors",
                  enabled
                    ? selected === key
                      ? "bg-white text-black"
                      : "text-white/80 hover:bg-white/10"
                    : "text-white/30 cursor-not-allowed",
                ].join(" ")}
              >
                {SLOT_LABEL[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[16rem]">
        <Case3DPanel url={activeUrl ?? null} />
      </div>
    </div>
  );
}