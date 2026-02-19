// components/case-process/StageProgress.tsx
"use client";

import React from "react";
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

  return (
    <div className="flex items-center w-full px-2 mt-4">
      {STAGE_ORDER.map((s, idx) => {
        const isLast = idx === STAGE_ORDER.length - 1;
        const isDone = idx < currentIndex || isFullyDelivered;
        const isCurrent = idx === currentIndex && !isFullyDelivered;
        const isFullyFinished = isLast && isFullyDelivered;

        // Logic: Line is active if the NEXT node is reached
        const isLineActive = (idx + 1) <= currentIndex || isFullyDelivered;

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
                      ? "!bg-[#9696e2] !border-[#9696e2] text-white" 
                      : isCurrent
                        ? "bg-surface !border-[#9696e2] text-[#9696e2] scale-110 shadow-lg shadow-[#9696e2]/20"
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
                    : isCurrent ? "text-[#9696e2]" : "text-gray-400"}
                `}
              >
                {(isLast && isFullyDelivered) ? STAGE_LABEL.DELIVERED : STAGE_LABEL[s]}
              </span>
            </div>

            {/* SEGMENTED LINE: Pure Tailwind Dark Mode Logic */}
            {!isLast && (
              <div
                className={`
                  h-1.5 flex-1 mx-2 rounded-full transition-colors duration-200
                  ${isLineActive 
                    ? "bg-black dark:bg-white" 
                    : "bg-gray-300 dark:bg-gray-600"
                  }
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}