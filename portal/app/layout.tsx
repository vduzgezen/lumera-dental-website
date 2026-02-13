// portal/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Lumera Dental Portal",
  description: "Advanced Dental Case Management",
  icons: {
    icon: "/Images/Icon-Purple.png", 
    shortcut: "/Images/Icon-Purple.png",
    apple: "/Images/Icon-Purple.png",
  },
};

// FOUC Prevention Script - runs before hydration
const foucPreventionScript = `
  (function() {
    try {
      const theme = localStorage.getItem("lumera_theme");
      if (theme === "light") {
        document.documentElement.classList.add("light");
      }
    } catch (e) {
      // localStorage not available
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: foucPreventionScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}