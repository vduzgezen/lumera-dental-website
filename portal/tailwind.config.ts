// portal/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Backgrounds
        background: "#1e1e1e", // Your new brand dark charcoal
        surface: "#2a2a2a",    // Slightly lighter for cards/sidebars
        
        // Brand Accents
        accent: "#9696e2",     // Your new brand purple
        accentHover: "#8282d6", // Slightly darker purple for hover states
        
        // Text Colors
        foreground: "#f5f7fb", // High contrast white
        muted: "#a1a1aa",      // Secondary text grey
        
        // Semantic Colors (Status indicators remain roughly the same)
        success: "#34d399",    // Emerald for "Approved/Completed"
        warning: "#fbbf24",    // Amber for "Needs Review"
        error: "#f87171",      // Red for "Rejected/Error"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;