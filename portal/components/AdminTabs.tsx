// portal/components/AdminTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs() {
  const pathname = usePathname();
  
  const Tab = ({ href, label }: { href: string; label: string }) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "bg-accent text-white" : "text-muted hover:bg-[var(--accent-dim)] hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Tab href="/portal/admin/users" label="Users" />
      <Tab href="/portal/admin/clinics" label="Clinics" />
      <Tab href="/portal/admin/addresses" label="Addresses" />
      <Tab href="/portal/admin/requests" label="Requests" />
      <Tab href="/portal/admin/financials" label="Financials" />
    </div>
  );
}