// portal/app/portal/layout.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <PortalSidebar role={session.role}>{children}</PortalSidebar>;
}