// portal/components/case-process/StageProgress.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import type { ProductionStage } from "@/lib/types";

// The strict 4-stage order
export const STAGE_ORDER: ProductionStage[] = ["DESIGN", "MILLING_GLAZING", "SHIPPING", "COMPLETED"];

export const STAGE_LABEL: Record<ProductionStage, string> = {
  DESIGN: "Designing",
  MILLING_GLAZING: "Milling",
  SHIPPING: "Shipping",
  COMPLETED: "Arrived",
  DELIVERED: "Delivered",
};

interface StageProgressProps {
  currentStage: ProductionStage;
  isFullyDelivered: boolean;
}

export function StageProgress({ currentStage, isFullyDelivered }: StageProgressProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center w-full px-2 mt-4">
      {STAGE_ORDER.map((s, idx) => {
        const isLast = idx === STAGE_ORDER.length - 1;
        const isDone = idx < currentIndex || isFullyDelivered;
        const isCurrent = idx === currentIndex && !isFullyDelivered;
        const isFullyFinished = isLast && isFullyDelivered;

        // Logic: Line is active if the NEXT node is reached
        const isLineActive = (idx + 1) <= currentIndex || isFullyDelivered;

        // --- DYNAMIC COLOR LOGIC (Bypassing Tailwind) ---
        // If not mounted yet, default to light mode to prevent crash/flash
        const isDark = mounted && resolvedTheme === "dark";
        
        // Active Line: White in Dark Mode, Black in Light Mode
        const activeLineColor = isDark ? "#ffffff" : "#000000";
        
        // Inactive Line: Dark Gray in Dark Mode, Light Gray in Light Mode
        const inactiveLineColor = isDark ? "#374151" : "#d1d5db"; // gray-700 vs gray-300

        return (
          <React.Fragment key={s}>
            {/* NODE */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300
                  ${isFullyFinished
                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30 scale-110" 
                    : (isDone || (isLast && isCurrent))
                      ? "!bg-blue-600 !border-blue-600 text-white" 
                      : isCurrent
                        ? "bg-surface !border-blue-600 text-blue-600 scale-110 shadow-lg shadow-blue-500/20"
                        : "bg-surface border-gray-300 dark:border-gray-700 text-muted"}
                `}
              >
                {(isDone || isFullyFinished) ? "✓" : idx + 1}
              </div>

              {/* LABEL */}
              <span
                className={`
                  absolute -bottom-7 whitespace-nowrap text-[9px] font-bold tracking-wider uppercase transition-colors
                  ${isFullyFinished
                    ? "text-green-600 dark:text-green-400"
                    : isCurrent ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}
                `}
              >
                {(isLast && isFullyDelivered) ? STAGE_LABEL.DELIVERED : STAGE_LABEL[s]}
              </span>
            </div>

            {/* SEGMENTED LINE */}
            {!isLast && (
              <div
                className="h-1.5 flex-1 mx-2 rounded-full transition-colors duration-200"
                style={{ 
                  backgroundColor: isLineActive ? activeLineColor : inactiveLineColor 
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}