// components/CaseListRow.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CopyableId from "@/components/CopyableId";

type CaseRowData = {
  id: string;
  patientAlias: string;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  doctorName: string | null;
  clinic: { name: string };
};

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function CaseListRow({ data }: { data: CaseRowData }) {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(`/portal/cases/${data.id}`);
  };

  const getStatusColor = (s: string) => {
    const status = s.toUpperCase();
    
    // DELIVERING -> BLUE
    if (status === "SHIPPED") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    // PRODUCTION -> PURPLE
    if (status === "IN_MILLING") {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }

    // APPROVED -> GREEN (New Guard Rail Visual)
    if (status === "APPROVED") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    // DESIGNING (Everything else) -> ORANGE
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  };

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-white/5 transition-colors group cursor-pointer border-t border-white/5"
    >
      <td className="p-3">
        <CopyableId id={data.id} truncate />
      </td>
      <td className="p-3 font-medium">
        <Link 
          href={`/portal/cases/${data.id}`} 
          className="hover:underline hover:text-blue-300"
        >
          {data.patientAlias}
        </Link>
      </td>
      <td className="p-3 text-white/70">{data.clinic.name}</td>
      <td className="p-3 text-white/70">{data.doctorName ?? "—"}</td>
      <td className="p-3 text-white/70">{data.toothCodes}</td>
      <td className="p-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
            data.status
          )}`}
        >
          {data.status.replace(/_/g, " ")}
        </span>
      </td>
      <td className="p-3 text-white/70">{fmtDate(data.dueDate)}</td>
      <td className="p-3 text-white/50">{fmtDate(data.updatedAt)}</td>
    </tr>
  );
}