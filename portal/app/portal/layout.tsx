// portal/app/portal/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useState } from "react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Default to TRUE so it starts closed
  const [isCollapsed, setIsCollapsed] = useState(true);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setIsSigningOut(false);
    }
  }

  const navItem = (path: string, label: string, icon: React.ReactNode) => {
    const isActive = pathname.startsWith(path);
    return (
      <Link
        href={path}
        title={isCollapsed ? label : ""}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-accent/10 text-accent border border-accent/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
        } ${isCollapsed ? "justify-center px-2" : ""}`}
      >
        <div className="flex-shrink-0">{icon}</div>
        {!isCollapsed && (
          <span className="font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
            {label}
          </span>
        )}
      </Link>
    );
  };

  return (
    // FIX: Changed min-h-screen to h-screen + overflow-hidden to lock the page
    <div className="flex h-screen w-full bg-midnight text-white overflow-hidden transition-all">
      {/* SIDEBAR */}
      <aside 
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } border-r border-white/5 bg-[#0a1020] flex flex-col fixed h-full z-20 transition-all duration-300 ease-in-out`}
      >
        <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/portal/cases">
            <Logo showText={!isCollapsed} />
          </Link>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-midnight border border-white/10 rounded-full p-1 text-white/40 hover:text-white shadow-lg z-50 transition-colors"
        >
          {isCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          )}
        </button>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {navItem(
            "/portal/cases", 
            "Cases", 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          )}
          
          {navItem(
            "/portal/billing", 
            "Billing", 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}

          {navItem(
            "/portal/admin", 
            "Admin", 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/"
            title={isCollapsed ? "Back to Website" : ""}
            className={`flex items-center gap-3 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors ${isCollapsed ? "justify-center" : ""}`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {!isCollapsed && <span>Back to Website</span>}
          </Link>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            title={isCollapsed ? "Sign Out" : ""}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!isCollapsed && <span>{isSigningOut ? "..." : "Sign Out"}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      {/* FIX: Removed p-8 and max-w-7xl to remove double scrollbars */}
      <main className={`flex-1 h-full transition-all duration-300 ease-in-out ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {children}
      </main>
    </div>
  );
}