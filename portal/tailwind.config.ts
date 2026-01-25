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
        // Base Backgrounds (Updated to Midnight Blue Theme)
        background: "#0a1020", // Deep Midnight Blue
        surface: "#111b2d",    // Slightly lighter blue for cards/sidebars (Replacing Grey)
        
        // Brand Accents
        accent: "#9696e2",     // Brand purple
        accentHover: "#8282d6", 
        
        // Text Colors
        foreground: "#f5f7fb", // High contrast white
        muted: "#94a3b8",      // Blue-grey for secondary text
        
        // Semantic Colors
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