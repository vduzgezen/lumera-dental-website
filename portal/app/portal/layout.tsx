// portal/app/portal/layout.tsx
import PortalSidebar from "@/components/PortalSidebar";
import { getSession } from "@/lib/auth"; 
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    // FRAME: Locks the browser window. Nothing outside this div can scroll.
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a1020] text-[#f5f7fb]">
      
      {/* Sidebar: Fixed width, full height */}
      <PortalSidebar userRole={session.role} />

      {/* Main Content: Fills remaining width/height. 
          We do NOT scroll here. We let the child pages decide what scrolls. */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </main>
    </div>
  );
}