// portal/components/PublicNavbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PublicNavbar() {
  const pathname = usePathname();

  const navLink = (path: string, label: string) => {
    const isActive = pathname === path;
    return (
      <Link
        href={path}
        className={`text-sm font-medium transition-colors hover:text-white ${
          isActive ? "text-foreground" : "text-muted"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image 
            src="/Images/Lumera-Lab-White.png" 
            alt="Lumera" 
            width={320} 
            height={64} 
            className="h-16 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLink("/", "Home")}
          {navLink("/work", "Our Work")}
          {navLink("/about", "About")}
          {navLink("/contact", "Contact")}
        </nav>

        {/* CTA / Login */}
        <div className="flex items-center gap-4">
          {/* FIX: Corrected route from /auth/login to /login */}
          <Link 
            href="/login" 
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-background bg-white rounded-full hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Send a Case
          </Link>
        </div>
      </div>
    </header>
  );
}