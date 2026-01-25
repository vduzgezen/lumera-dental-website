// portal/components/Logo.tsx
import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {showText ? (
        // FULL WHITE LOGO (Expanded)
        // 'w-full h-auto' allows it to scale up to the container's width (w-52 in sidebar)
        <Image 
          src="/Images/Lumera-Lab-White-.png" 
          alt="Lumera Dental" 
          width={240} 
          height={64} 
          className="w-full h-auto object-contain"
          priority
        />
      ) : (
        // PURPLE ICON (Collapsed)
        // Fixed dimensions ensure it stays sharp in the narrow sidebar
        <Image 
          src="/Images/ONLY-ICON-Purple-.png" 
          alt="Lumera Icon" 
          width={32} 
          height={32} 
          className="w-8 h-8 object-contain"
        />
      )}
    </div>
  );
}