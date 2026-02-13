// portal/components/ThemeToggle.tsx
"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ expanded = true }: { expanded?: boolean }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      // ✅ FIX: 'transition-[background-color]' stops the icon/text delay
      className={`
        h-11 flex items-center rounded-lg transition-[background-color] duration-200 group
        ${expanded 
          ? "w-full px-3 justify-start" 
          : "w-11 justify-center"
        }
        text-muted hover:bg-[var(--accent-dim)] hover:text-accent
      `}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="shrink-0 group-hover:scale-110 transition-transform flex items-center justify-center">
        {isDark ? (
          <Sun size={20} className="text-yellow-400" />
        ) : (
          <Moon size={20} className="text-accent" />
        )}
      </div>
      
      <span 
        className={`
          ml-3 font-medium whitespace-nowrap transition-opacity duration-300 overflow-hidden
          ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}
        `}
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}