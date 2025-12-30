// portal/components/Logo.tsx
import React from "react";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "w-8 h-8", textClassName = "text-xl", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Abstract Tooth/Gem Prism Icon */}
      <div className={`${className} rounded bg-gradient-to-br from-accent to-accent2 shadow-[0_0_15px_rgba(121,231,224,0.4)] relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
        {/* Simple geometric cut */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-black/10 -translate-y-1/2 translate-x-1/2 rotate-45" />
      </div>
      
      {showText && (
        <span className={`${textClassName} font-light tracking-wide text-white`}>
          Lumera
        </span>
      )}
    </div>
  );
}