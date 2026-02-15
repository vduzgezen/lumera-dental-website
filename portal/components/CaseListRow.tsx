// components/CaseListRow.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CopyableId from "@/components/CopyableId";

type CaseRowData = {
  id: string;
  patientAlias: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  toothCodes: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date; 
  doctorName: string | null;
  clinic: { name: string };
  assigneeUser: { name: string | null; email: string } | null;
};

// --- HELPER 1: Designer Avatar ---
const DesignerAvatar = ({ name, email }: { name: string | null, email: string }) => {
  const initials = name 
    ? (name.split(" ").length > 1 
        ? (name.split(" ")[0][0] + name.split(" ")[name.split(" ").length - 1][0]) 
        : name.slice(0, 2))
    : email.slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      {/* BACKGROUND: Light Mode = Solid Gray 300. Night Mode = Transparent Blue.
         TEXT: Uses 'text-foreground' which maps to CSS var(--foreground).
         This GUARANTEES Black in Light Mode and White in Night Mode.
      */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm 
        bg-gray-300 border border-gray-400 text-foreground
        dark:bg-blue-600/30 dark:border-blue-400/50 dark:text-white">
        {initials.toUpperCase()}
      </div>
      <span className="text-muted text-xs truncate max-w-[100px]">
        {name || email.split("@")[0]}
      </span>
    </div>
  );
};

// --- HELPER 2: Status Badge ---
const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toUpperCase();
  
  // Base classes
  // We use 'text-foreground' here to bind to the global theme text color.
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide shadow-sm transition-colors text-foreground dark:text-white";

  let colorClasses = "";

  switch (s) {
    case "APPROVED":
      // Light: Lime 300 (Solid) | Night: Lime Transparent
      colorClasses = "bg-lime-300 border-lime-400 dark:bg-lime-500/20 dark:border-lime-500/40";
      break;
    case "IN_MILLING":
      // Light: Yellow 300 (Solid) | Night: Yellow Transparent
      colorClasses = "bg-yellow-300 border-yellow-400 dark:bg-yellow-500/20 dark:border-yellow-500/40";
      break;
    case "SHIPPED":
      // Light: Blue 300 (Solid) | Night: Blue Transparent
      colorClasses = "bg-blue-300 border-blue-400 dark:bg-blue-500/20 dark:border-blue-500/40";
      break;
    case "COMPLETED":
      // Light: Emerald 300 (Solid) | Night: Emerald Transparent
      colorClasses = "bg-emerald-300 border-emerald-400 dark:bg-emerald-500/20 dark:border-emerald-500/40";
      break;
    case "DELIVERED":
      // Light: Purple 300 (Solid) | Night: Purple Transparent
      colorClasses = "bg-purple-300 border-purple-400 dark:bg-purple-500/20 dark:border-purple-500/40";
      break;
    case "CHANGES_REQUESTED":
      // Light: Red 300 (Solid) | Night: Red Transparent
      colorClasses = "bg-red-300 border-red-400 dark:bg-red-500/20 dark:border-red-500/40";
      break;
    case "IN_DESIGN":
    case "DESIGN":
    default:
      // Light: Orange 300 (Solid) | Night: Orange Transparent
      colorClasses = "bg-orange-300 border-orange-400 dark:bg-orange-500/20 dark:border-orange-500/40";
      break;
  }

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

export default function CaseListRow({ data, role }: { data: CaseRowData, role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    router.push(`/portal/cases/${data.id}`);
  };

  const markDelivered = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    try {
        const res = await fetch(`/api/cases/${data.id}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: "DELIVERED" })
        });
        if (!res.ok) throw new Error("Failed");
        router.refresh();
    } catch {
        alert("Error updating status");
        setBusy(false);
    }
  };

  const fmtDate = (d?: Date | null) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-[var(--accent-dim)] transition-colors group cursor-pointer border-t border-border"
    >
      <td className="p-3">
        <CopyableId id={data.id} truncate />
      </td>
      <td className="p-3 font-medium text-foreground">
        {data.patientAlias}
      </td>
      
      {role === "customer" ? (
        <td className="p-3 text-foreground/90">
            {data.patientLastName && data.patientFirstName 
                ? `${data.patientLastName}, ${data.patientFirstName}` 
                : <span className="text-muted italic">No name</span>}
        </td>
      ) : (
        <td className="p-3 text-muted">{data.doctorName ?? "—"}</td>
      )}

      <td className="p-3 text-muted">{data.clinic.name}</td>
      
      {role !== "customer" && (
        <td className="p-3">
            {data.assigneeUser ? (
                <DesignerAvatar name={data.assigneeUser.name} email={data.assigneeUser.email} />
            ) : (
                <span className="text-muted/50 text-xs italic">—</span>
            )}
        </td>
      )}

      <td className="p-3 text-muted">{data.toothCodes}</td>
      
      <td className="p-3 relative text-center">
         <div className={`transition-opacity duration-200 ${(role === "customer" && data.status === "COMPLETED") ? "group-hover:opacity-10" : ""}`}>
            <StatusBadge status={data.status} />
         </div>

         {role === "customer" && data.status === "COMPLETED" && (
            <button 
                onClick={markDelivered}
                disabled={busy}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-purple-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-lg hover:bg-purple-500 hover:scale-105 z-10 whitespace-nowrap ring-1 ring-white/20"
            >
                {busy ? "..." : "Mark Delivered"}
            </button>
        )}
      </td>
      
      <td className="p-3 text-muted">{fmtDate(data.dueDate)}</td>
      <td className="p-3 text-muted/70">{fmtDate(data.createdAt)}</td> 
    </tr>
  );
}