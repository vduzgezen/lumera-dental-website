// portal/components/Case3DPanel.tsx
"use client";

import { useEffect, useState } from "react";
import STLViewer from "./STLViewer";

// Removed unused 'title' prop
export default function Case3DPanel({ url }: { url: string | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-black/20 animate-pulse" />;

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
        No 3D model available
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0a1020] relative">
      <STLViewer url={url} />
    </div>
  );
}