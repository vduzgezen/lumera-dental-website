// portal/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumera Dental Portal",
  description: "Advanced Dental Case Management",
  icons: {
    icon: [
      { url: "/Images/ONLY-ICON-Purple-.png?v=3", type: "image/png" },
    ],
    shortcut: ["/Images/ONLY-ICON-Purple-.png?v=3"],
    apple: [
      { url: "/Images/ONLY-ICON-Purple-.png?v=3", sizes: "180x180", type: "image/png" },
    ],
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