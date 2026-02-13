// portal/components/Logo.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to Dark Mode (White Logo) on server/initial render
  const showLightLogo = mounted && !isDark;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {showText ? (
        <div className="relative w-full h-16 flex items-center justify-center">
          {showLightLogo ? (
            <Image 
              key="light-logo"
              src="/Images/Lumera-Lab-Black-and-Purple.png" 
              alt="Lumera Dental" 
              width={192} 
              height={51} 
              className="w-48 h-auto object-contain animate-in fade-in duration-200"
              priority
              unoptimized // ✅ FIX: Forces direct load of local file
            />
          ) : (
            <Image 
              key="dark-logo"
              src="/Images/Lumera-Lab-White.png" 
              alt="Lumera Dental" 
              width={192} 
              height={51} 
              className="w-48 h-auto object-contain animate-in fade-in duration-200"
              priority
              unoptimized // ✅ FIX: Forces direct load of local file
            />
          )}
        </div>
      ) : (
        // Collapsed Icon
        <Image 
          src="/Images/Icon-Purple.png" 
          alt="Lumera Icon" 
          width={32} 
          height={32} 
          className="w-8 h-8 object-contain"
          unoptimized
        />
      )}
    </div>
  );
}