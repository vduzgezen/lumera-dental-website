// portal/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumera Dental Portal",
  description: "Advanced Dental Case Management",
  icons: {
    icon: "/Images/Logo-Purple-White.png", 
    shortcut: "/Images/Logo-Purple-White.png",
    apple: "/Images/Logo-Purple-White.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-porcelain">
        {children}
      </body>
    </html>
  );
}