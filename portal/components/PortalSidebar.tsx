// portal/components/PortalSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "./Logo";
// Icons
import { 
  LayoutDashboard, 
  FolderOpen, 
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck 
} from "lucide-react";

export default function PortalSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  
  // Initialize with a function to avoid hydration mismatch, or handle in useEffect
  // We start 'true' to match server render, then sync with local storage
  const [expanded, setExpanded] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // ✅ FIX: Load preference on mount
  useEffect(() => {
    const saved = window.localStorage.getItem("lumera_sidebar");
    if (saved !== null) {
      setExpanded(saved === "true");
    }
  }, []);

  // ✅ FIX: Save preference on toggle
  const toggleSidebar = () => {
    const next = !expanded;
    setExpanded(next);
    window.localStorage.setItem("lumera_sidebar", String(next));
  };

  const navItems = [
    { label: "Dashboard", href: "/portal/cases", icon: LayoutDashboard, roles: ["customer", "lab", "admin", "milling"] },
    { label: "New Case", href: "/portal/cases/new", icon: FolderOpen, roles: ["lab", "admin"] },
    { label: "Billing", href: "/portal/billing", icon: CreditCard, roles: ["customer", "admin"] },
    { label: "Admin", href: "/portal/admin/users", icon: ShieldCheck, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed", e);
      setLoggingOut(false);
    }
  }

  return (
    <aside 
      className={`
        h-full bg-[#0a1020] border-r border-white/5 
        transition-all duration-300 ease-in-out flex flex-col shrink-0 relative
        ${expanded ? "w-64" : "w-20"}
      `}
    >
      {/* Header / Logo - Fixed Height */}
      <div className="h-24 flex items-center justify-center shrink-0 p-6">
        <div className={`${expanded ? "w-48" : "w-8"} transition-all duration-300 flex justify-center items-center`}>
          <Logo showText={expanded} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {filteredNav.map((item) => {
          const isActive = item.label === "Admin" 
            ? pathname.startsWith("/portal/admin")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
            
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                h-11 flex items-center rounded-lg transition-all group relative
                ${expanded 
                  ? "w-full px-3 justify-start" 
                  : "w-11 justify-center"
                }
                ${isActive 
                  ? "bg-accent text-background font-bold shadow-none" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
                }
              `}
              title={!expanded ? item.label : ""}
            >
              <Icon 
                size={20} 
                className={`
                  shrink-0 transition-colors duration-300
                  ${isActive ? "text-background" : "text-white/40 group-hover:text-white"}
                `} 
              />
              
              <span 
                className={`
                  ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                  ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/5 bg-[#0a1020] flex flex-col items-center">
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className={`
            h-11 flex items-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors group
            ${expanded 
              ? "w-full px-3 justify-start" 
              : "w-11 justify-center"
            }
          `}
          title={!expanded ? "Sign Out" : ""}
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          <span 
             className={`
               ml-3 font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
               ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}
             `}
          >
            {loggingOut ? "..." : "Sign Out"}
          </span>
        </button>

        <button
          onClick={toggleSidebar}
          className="mt-2 w-full flex justify-center py-2 text-white/20 hover:text-accent transition-colors"
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
}