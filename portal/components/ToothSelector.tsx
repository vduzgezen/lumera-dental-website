// portal/components/ToothSelector.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export interface ToothSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => 32 - i);

export default function ToothSelector({ value, onChange }: ToothSelectorProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (value) {
      const nums = value
        .split(",")
        .map((s: string) => parseInt(s.trim()))
        .filter((n: number) => !isNaN(n));
      setSelected(new Set(nums));
    }
  }, [value]);

  const toggleTooth = (num: number) => {
    const next = new Set(selected);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setSelected(next);
    onChange(Array.from(next).sort((a, b) => a - b).join(", "));
  };

  const ToothImage = ({ num }: { num: number }) => {
    const active = selected.has(num);
    return (
      <button
        type="button"
        onClick={() => toggleTooth(num)}
        // ✅ FIX: "Tighter" padding (p-1), "Smaller" scale (105), Ring Indicator.
        className={`
          group flex flex-col items-center justify-end transition-all duration-200 
          p-1 rounded-md flex-1 min-w-[32px] max-w-[50px] cursor-pointer relative
          ${active 
            ? "scale-105 z-20 ring-2 ring-accent bg-accent/20 opacity-100 shadow-sm" 
            : "scale-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105 hover:bg-black/5 dark:hover:bg-white/5"}
        `}
      >
        {/* Responsive Image Container */}
        <div className="relative w-full aspect-[2/3]">
           <Image
             src={`/Images/T${num}.png`} 
             alt="" 
             fill
             className="object-contain"
             sizes="(max-width: 768px) 30px, 60px"
             priority={num < 10}
           />
        </div>
        
        {/* Number */}
        <span className={`
          mt-1 font-bold transition-colors text-[10px] sm:text-xs leading-none
          ${active ? "text-accent" : "text-muted group-hover:text-foreground/80"}
        `}>
          #{num}
        </span>
      </button>
    );
  };

  return (
    // ✅ FIX: Removed "overflow-hidden" to prevent top clipping
    <div className="w-full bg-surface rounded-xl border border-border p-4 sm:p-6 flex flex-col items-center gap-6 select-none shadow-inner">
      
      {/* Upper Arch */}
      <div className="w-full flex flex-col items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-widest font-semibold">Upper Arch</span>
        <div className="flex w-full overflow-x-visible pb-2 px-1 gap-1 justify-between">
          {UPPER_TEETH.map((t) => <ToothImage key={t} num={t} />)}
        </div>
      </div>

      {/* Divider */}
      <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Lower Arch */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="flex w-full overflow-x-visible pb-2 px-1 gap-1 justify-between">
          {LOWER_TEETH.map((t) => <ToothImage key={t} num={t} />)}
        </div>
        <span className="text-xs text-muted uppercase tracking-widest font-semibold">Lower Arch</span>
      </div>

      {selected.size === 0 && (
        <p className="text-xs text-red-400/80 mt-1 font-medium animate-pulse">
          Click teeth to select
        </p>
      )}
    </div>
  );
}