// components/Case3DPanel.tsx
"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const STLViewer = dynamic(() => import("@/components/STLViewer"), {
  ssr: false,
});

export default function Case3DPanel({
  url,
  title, // title is unused now (handled by parent tabs)
}: {
  url?: string | null;
  title?: string;
}) {
  const hasModel = !!url;
  const source = useMemo(() => url ?? "", [url]);

  if (!hasModel) {
    return (
      <div className="flex items-center justify-center h-full text-white/60 text-sm">
        No 3D file available for this slot.
      </div>
    );
  }

  return (
    // FIX: No borders, no padding. Just full size content.
    <div className="w-full h-full bg-black/30 rounded-lg overflow-hidden relative min-h-[400px]">
      <STLViewer url={source} />
    </div>
  );
}