// components/AutoRefresh.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      // Re-run the Server Component data fetching
      router.refresh(); 
    }, intervalMs);

    // Cleanup timer on unmount
    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null; // Invisible component
}