// portal/components/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("lumera-theme");
    // Default to light if no preference; only go dark if explicitly saved
    const initial = saved ? saved === "dark" : false;
    setIsDark(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("lumera-theme", next ? "dark" : "light");
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {/* This script runs IMMEDIATELY before the body is rendered.
        It prevents the theme flash by applying the class before React mounts.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var saved = localStorage.getItem('lumera-theme');
                // Default to light; only apply dark if explicitly saved
                if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
