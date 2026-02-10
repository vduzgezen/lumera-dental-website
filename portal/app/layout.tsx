// portal/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumera Dental Portal",
  description: "Advanced Dental Case Management",
  icons: {
    icon: "/Images/ONLY-ICON-Purple-.png", // ✅ Uses your existing purple logo
    shortcut: "/Images/ONLY-ICON-Purple-.png",
    apple: "/Images/ONLY-ICON-Purple-.png", // For iPhone home screen shortcuts
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