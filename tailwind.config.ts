// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-highlight": "var(--surface-highlight)",
        accent: "var(--accent)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        border: "var(--glass-border)",
        sidebar: "var(--sidebar-bg)",
        sidebarBorder: "var(--sidebar-border)",
        success: "#34d399",
        warning: "#fbbf24",
        error: "#f87171",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;