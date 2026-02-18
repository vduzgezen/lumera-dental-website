// components/PortalSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  LayoutDashboard, FolderOpen, CreditCard, LogOut,
  ChevronRight, ChevronLeft, ShieldCheck, DollarSign
} from "lucide-react";

const COOKIE_NAME = "lumera_sidebar_v2";

function setSidebarCookie(isOpen: boolean) {
  // Set new global cookie
  document.cookie = `${COOKIE_NAME}=${isOpen}; path=/; max-age=31536000; SameSite=Lax`;
}

// FIX: Aggressively delete old conflicting cookies on any path
function nukeOldCookies() {
  const oldCookies = ["lumera_sidebar", "lumera_sidebar_state"];
  oldCookies.forEach(name => {
    // Delete generic
    document.cookie = `${name}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    // Delete root path
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

interface Props {
  userRole: string;
  defaultOpen?: boolean;
}

export default function PortalSidebar({ userRole, defaultOpen = true }: Props) {
  const pathname = usePathname();
  
  const [expanded, setExpanded] = useState(defaultOpen);
  const [loggingOut, setLoggingOut] = useState(false);

  // Run cleanup once on mount
  useEffect(() => {
    nukeOldCookies();
  }, []);

  const toggleSidebar = () => {
    const next = !expanded;
    setExpanded(next);
    
    // Save new V2 cookie
    setSidebarCookie(next);
    window.localStorage.setItem(COOKIE_NAME, String(next));
  };

  const navItems = [
    { label: "Dashboard", href: "/portal/cases", icon: LayoutDashboard, roles: ["customer", "lab", "admin", "milling", "sales"] },
    { label: "New Case", href: "/portal/cases/new", icon: FolderOpen, roles: ["lab", "admin"] },
    { label: "Billing", href: "/portal/billing", icon: CreditCard, roles: ["customer", "admin"] },
    { label: "Milling Finance", href: "/portal/cases/milling/finance", icon: DollarSign, roles: ["milling", "admin"] },
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
        h-full bg-sidebar border-r border-border
        transition-all duration-300 ease-in-out flex flex-col shrink-0 relative
        ${expanded ? "w-64" : "w-20"}
      `}
    >
      <div className="h-24 flex items-center justify-center shrink-0 p-6">
        <div className={`${expanded ? "w-48" : "w-8"} transition-all duration-300 flex justify-center items-center`}>
          <Logo showText={expanded} />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {filteredNav.map((item) => {
          let isActive = false;
          if (item.label === "Dashboard") {
             const isFinance = pathname.startsWith("/portal/cases/milling/finance");
             const isNew = pathname.startsWith("/portal/cases/new");
             isActive = pathname.startsWith("/portal/cases") && !isFinance && !isNew;
          } else {
             isActive = pathname.startsWith(item.href);
          }
            
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                h-11 flex items-center rounded-lg group relative transition-[background-color] duration-200
                ${expanded ? "w-full px-3 justify-start" : "w-11 justify-center"}
                ${isActive 
                  ? "bg-[var(--accent-dim)] text-accent font-semibold shadow-sm" 
                  : "text-muted hover:bg-[var(--accent-dim)] hover:text-accent"
                }
              `}
              title={!expanded ? item.label : ""}
            >
              <Icon size={20} className={`shrink-0 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} />
              <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-opacity duration-300 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-sidebar border-t border-border flex flex-col items-center space-y-2 transition-colors duration-200">
        <ThemeToggle expanded={expanded} />
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className={`
            h-11 flex items-center rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-[background-color] duration-200 group cursor-pointer
            ${expanded ? "w-full px-3 justify-start" : "w-11 justify-center"}
          `}
          title={!expanded ? "Log Out" : ""}
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          <span className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-300 overflow-hidden ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}`}>
            {loggingOut ? "..." : "Log Out"}
          </span>
        </button>
        <button onClick={toggleSidebar} className="w-full flex justify-center py-2 text-muted hover:text-accent transition-colors duration-200 cursor-pointer">
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
}