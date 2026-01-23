// portal/components/Logo.tsx
import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "w-8 h-8", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {showText ? (
        <Image 
          src="/Images/Lumera-Lab-White-.png" 
          alt="Lumera" 
          width={120} 
          height={32} 
          className="h-8 w-auto"
        />
      ) : (
        <Image 
          src="/Images/ONLY-ICON-Purple-.png" 
          alt="Lumera" 
          width={32} 
          height={32} 
          className={className}
        />
      )}
    </div>
  );
}