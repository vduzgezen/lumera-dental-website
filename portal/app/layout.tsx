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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}