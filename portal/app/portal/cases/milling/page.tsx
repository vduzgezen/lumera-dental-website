// app/portal/cases/milling/page.tsx
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import MillingView from "../MillingView";

export const dynamic = "force-dynamic";

export default async function AdminMillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  
  // ✅ Allow both milling AND admin to access this specific route
  if (!session || (session.role !== "admin" && session.role !== "milling")) {
    return notFound();
  }

  const sp = await searchParams;

  return <MillingView searchParams={sp} />;
}