// portal/app/portal/admin/layout.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/portal/cases");

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      {/* HEADER REMOVED: Tabs and Title are now merged into the client pages for better alignment */}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}