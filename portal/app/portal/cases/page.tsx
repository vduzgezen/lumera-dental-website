// app/portal/cases/page.tsx
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import MillingView from "./MillingView";
import StandardView from "./StandardView";

// Re-export shared type for backward compatibility with other components
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

  if (session.role === "milling") {
    return <MillingView searchParams={sp} />;
  }

  return <StandardView searchParams={sp} session={session} />;
}