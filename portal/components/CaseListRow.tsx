// components/CaseListRow.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CopyableId from "@/components/CopyableId";
import { formatProductName } from "@/lib/pricing";

// ✅ Added triage flags to the type definition
type CaseRowData = {
  id: string;
  patientAlias: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  toothCodes: string;
  product: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  clinic: { name: string };
  assigneeUser: { name: string | null; email: string } | null;
  actionRequiredBy?: string | null;
  unreadForDoctor?: boolean;
  unreadForLab?: boolean;
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
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm 
        bg-gray-300 border border-gray-400 text-foreground
        dark:bg-[#9696e2]/30 dark:border-[#9696e2]/50 dark:text-white">
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
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide shadow-sm transition-colors";
  let colorClasses = "text-foreground dark:text-white ";
  
  switch (s) {
    case "APPROVED":
      colorClasses += "bg-lime-300 border-lime-400 dark:bg-lime-500/20 dark:border-lime-500/40";
      break;
    case "IN_MILLING":
      colorClasses += "bg-yellow-300 border-yellow-400 dark:bg-yellow-500/20 dark:border-yellow-500/40";
      break;
    case "SHIPPED":
      colorClasses += "bg-blue-300 border-blue-400 dark:bg-blue-500/20 dark:border-blue-500/40";
      break;
    case "COMPLETED":
      colorClasses += "bg-emerald-300 border-emerald-400 dark:bg-emerald-500/20 dark:border-emerald-500/40";
      break;
    case "DELIVERED":
      colorClasses += "bg-purple-300 border-purple-400 dark:bg-purple-500/20 dark:border-purple-500/40";
      break;
    case "CHANGES_REQUESTED":
      colorClasses += "bg-red-300 border-red-400 dark:bg-red-500/20 dark:border-red-500/40";
      break;
    case "CANCELLED":
      colorClasses += "bg-surface-highlight border-border dark:bg-background dark:border-white/10";
      break;
    case "READY_FOR_REVIEW": // ✅ Sub-status mapped to In Design styling
    case "IN_DESIGN":
    case "DESIGN":
    default:
      colorClasses += "bg-orange-300 border-orange-400 dark:bg-orange-500/20 dark:border-orange-500/40";
      break;
  }

  // ✅ To completely mask it and make it say "IN DESIGN", use the commented line instead.
  // const displayText = s === "READY_FOR_REVIEW" ? "IN DESIGN" : status.replace(/_/g, " ");
  const displayText = status.replace(/_/g, " ");

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {displayText}
    </span>
  );
};

export default function CaseListRow({ data, role }: { data: CaseRowData, role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // ✅ TRIAGE LOGIC
  const isDoctor = role === "customer";
  const roleTarget = isDoctor ? "DOCTOR" : "LAB";
  
  const requiresAction = data.actionRequiredBy === roleTarget;
  const hasUnread = isDoctor ? data.unreadForDoctor : data.unreadForLab;
  
  // Decide what dot to show (Red = Action Needed, Blue = Unread Message)
  const isPriority = requiresAction || hasUnread;
  const dotColor = requiresAction ? "bg-red-500" : "bg-blue-500";

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
      onClick={data.status === "CANCELLED" ? undefined : handleRowClick}
      className={`
        border-t border-border transition-colors group relative
        ${data.status === "CANCELLED" 
          ? "opacity-50 bg-surface/50" 
          : "hover:bg-[var(--accent-dim)] cursor-pointer"
        }
        ${isPriority && data.status !== "CANCELLED" ? "bg-[var(--accent-dim)]/50" : ""} // Highlight row slightly if priority
      `}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
           {/* ✅ BREATHING DOT */}
           {isPriority && data.status !== "CANCELLED" && (
             <div className="relative flex h-2.5 w-2.5 shrink-0">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
               <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}></span>
             </div>
           )}
           <CopyableId id={data.id} truncate />
        </div>
      </td>
      <td className={`p-3 font-medium ${isPriority ? "text-foreground font-bold" : "text-foreground"}`}>
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

      <td className="p-3 text-muted capitalize">{formatProductName(data.product)}</td>
      
      <td className="p-3 relative text-center">
         <div className={`transition-opacity duration-200 ${(role === "customer" && data.status === "COMPLETED") ? "group-hover:opacity-10" : ""}`}>
            <StatusBadge status={data.status} />
         </div>

         {role === "customer" && data.status === "COMPLETED" && (
            <button 
                onClick={markDelivered}
                disabled={busy}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-purple-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-lg hover:bg-purple-500 hover:scale-105 z-10 whitespace-nowrap ring-1 ring-white/20 cursor-pointer"
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