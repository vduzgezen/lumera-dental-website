// app/portal/cases/page.tsx
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation"; // ✅ Added redirect
import MillingView from "./MillingView";
import StandardView from "./StandardView";

export type { CaseRow } from "./types";

export const dynamic = "force-dynamic";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return notFound();

  const sp = await searchParams;

  // ✅ If a milling user lands on the standard cases page, redirect them to their dedicated view
  if (session.role === "milling") {
    redirect("/portal/cases/milling");
  }

  return <StandardView searchParams={sp} session={session} />;
}