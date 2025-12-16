// components/ToothSelector.tsx
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
        // FIX: 
        // 1. flex-1: Allows growing/shrinking to fill space.
        // 2. min-w-[32px]: The "certain point". If container < (16 * 32px), it scrolls.
        // 3. max-w-[60px]: Prevents them from getting cartoonishly huge on massive screens.
        className={`
          group flex flex-col items-center justify-end transition-all duration-200 
          py-2 rounded-lg flex-1 min-w-[32px] max-w-[60px]
          ${active 
            ? "scale-110 z-10 brightness-110 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)] bg-white/5" 
            : "scale-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105 hover:bg-white/5"}
        `}
      >
        {/* Responsive Image Container */}
        {/* aspect-[2/3] keeps the tooth ratio intact as width shrinks */}
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
          mt-2 font-bold transition-colors text-[10px] sm:text-xs
          ${active ? "text-blue-400" : "text-white/40 group-hover:text-white/80"}
        `}>
          #{num}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full bg-black/40 rounded-xl border border-white/10 p-4 sm:p-6 flex flex-col items-center gap-6 select-none shadow-inner overflow-hidden">
      
      {/* Upper Arch */}
      <div className="w-full flex flex-col items-center gap-2">
        <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Upper Arch</span>
        
        {/* Container:
            - flex: Row layout
            - w-full: Take full width
            - overflow-x-auto: Scroll ONLY if children force it via min-width
            - justify-between: Spread teeth evenly
        */}
        <div className="flex w-full overflow-x-auto custom-scrollbar pb-2 px-1 gap-1 justify-between">
          {UPPER_TEETH.map((t) => <ToothImage key={t} num={t} />)}
        </div>
      </div>

      {/* Divider */}
      <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Lower Arch */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="flex w-full overflow-x-auto custom-scrollbar pb-2 px-1 gap-1 justify-between">
          {LOWER_TEETH.map((t) => <ToothImage key={t} num={t} />)}
        </div>
        <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Lower Arch</span>
      </div>

      {selected.size === 0 && (
        <p className="text-xs text-red-400/80 mt-1 font-medium animate-pulse">
          Click teeth to select
        </p>
      )}
    </div>
  );
}