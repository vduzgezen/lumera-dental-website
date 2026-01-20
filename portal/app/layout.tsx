import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumera Dental Portal",
  description: "Advanced Dental Case Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Replaced Geist (Google Font) with standard system fonts.
        'font-sans' uses Tailwind's robust default stack: 
        (Inter, system-ui, -apple-system, Segoe UI, Roboto, etc.)
      */}
      <body className="font-sans antialiased bg-midnight text-porcelain">
        {children}
      </body>
    </html>
  );
}