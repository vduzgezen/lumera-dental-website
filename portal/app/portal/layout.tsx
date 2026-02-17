// app/portal/layout.tsx
import PortalSidebar from "@/components/PortalSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Force dynamic to ensure cookies are read fresh on every request
export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  
  // FIX: Read 'v2' cookie to bypass any old "ghost" cookies stuck on specific paths
  const sidebarCookie = cookieStore.get("lumera_sidebar_v2");
  
  // Default to true (Open) only if no cookie is found
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : true;

  // Debug log: Check your terminal to confirm the server sees the correct state
  console.log(`[Layout] Path: /portal/..., SidebarState: ${defaultOpen}`);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* key={String(defaultOpen)} forces React to re-mount if server state changes */}
      <PortalSidebar 
        key={String(defaultOpen)} 
        userRole={session.role} 
        defaultOpen={defaultOpen} 
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </main>
    </div>
  );
}