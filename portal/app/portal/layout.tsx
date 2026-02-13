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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Sidebar: Fixed width, full height */}
      <PortalSidebar userRole={session.role} />

      {/* Main Content: Fills remaining width/height */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </main>
    </div>
  );
}