// components/PortalSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  LayoutDashboard, FolderOpen, CreditCard, LogOut,
  ChevronRight, ChevronLeft, ShieldCheck, DollarSign, Factory
} from "lucide-react";

const COOKIE_NAME = "lumera_sidebar_v2";

function setSidebarCookie(isOpen: boolean) {
  document.cookie = `${COOKIE_NAME}=${isOpen}; path=/; max-age=31536000; SameSite=Lax`;
}

function nukeOldCookies() {
  const oldCookies = ["lumera_sidebar", "lumera_sidebar_state"];
  oldCookies.forEach(name => {
    document.cookie = `${name}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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

  useEffect(() => {
    nukeOldCookies();
  }, []);

  const toggleSidebar = () => {
    const next = !expanded;
    setExpanded(next);
    setSidebarCookie(next);
    window.localStorage.setItem(COOKIE_NAME, String(next));
  };

  const navItems = [
    { label: "Dashboard", href: "/portal/cases", icon: LayoutDashboard, roles: ["customer", "lab", "admin", "sales"] },
    { label: "New Case", href: "/portal/cases/new", icon: FolderOpen, roles: ["lab", "admin"] },
    { label: "Billing", href: "/portal/billing", icon: CreditCard, roles: ["customer", "admin"] },
    { label: "Production Dashboard", href: "/portal/cases/milling", icon: Factory, roles: ["milling", "admin"] },
    { label: "Production Finance", href: "/portal/cases/milling/finance", icon: DollarSign, roles: ["milling", "admin"] },
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
        ${expanded ? "w-64" : "w-[84px]"} // ✅ Nudged collapsed width slightly to house the bigger 52px buttons
      `}
    >
      <div className="h-24 flex items-center justify-center shrink-0 p-6">
        {/* ✅ Wrapped in a Next Link for quick dashboard access */}
        <Link href="/portal/cases" className="cursor-pointer block">
          <div className={`${expanded ? "w-48" : "w-8"} transition-all duration-300 flex justify-center items-center`}>
            <Logo showText={expanded} />
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {filteredNav.map((item) => {
          let isActive = false;
          
          if (item.label === "Dashboard") {
             const isMilling = pathname.startsWith("/portal/cases/milling");
             const isNew = pathname.startsWith("/portal/cases/new");
             isActive = pathname.startsWith("/portal/cases") && !isMilling && !isNew;
          } else if (item.label === "Production Dashboard") {
             const isFinance = pathname.startsWith("/portal/cases/milling/finance");
             isActive = pathname.startsWith("/portal/cases/milling") && !isFinance;
          } else {
             isActive = pathname.startsWith(item.href);
          }
            
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center rounded-lg group relative transition-[background-color] duration-200
                ${expanded ? "h-[50px] w-full px-3 justify-start" : "h-[50px] w-[50px] justify-center mx-auto"} {/* ✅ Upgraded to 52px square */}
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
            flex items-center rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-[background-color] duration-200 group cursor-pointer
            ${expanded ? "h-[52px] w-full px-3 justify-start" : "h-[52px] w-[52px] justify-center mx-auto"} {/* ✅ Upgraded to 52px square */}
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