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

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function CaseListRow({ data, role }: { data: CaseRowData, role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    router.push(`/portal/cases/${data.id}`);
  };

  const getStatusColor = (s: string) => {
    const status = s.toUpperCase();
    if (status === "CHANGES_REQUESTED") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (status === "DELIVERED") return "bg-purple-500/10 text-purple-400 border-purple-500/20"; 
    if (status === "COMPLETED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "SHIPPED") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (status === "IN_MILLING") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"; 
    if (status === "APPROVED") return "bg-lime-500/10 text-lime-300 border-lime-500/20";
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
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

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-white/5 transition-colors group cursor-pointer border-t border-white/5"
    >
      <td className="p-3">
        <CopyableId id={data.id} truncate />
      </td>
      <td className="p-3 font-medium text-white">
        {data.patientAlias}
      </td>
      
      {/* ✅ ORDER SWAPPED: Patient Name First */}
      {role === "customer" ? (
        <td className="p-3 text-white/90">
            {data.patientLastName && data.patientFirstName 
                ? `${data.patientLastName}, ${data.patientFirstName}` 
                : <span className="text-white/30 italic">No name</span>}
        </td>
      ) : (
        <td className="p-3 text-white/70">{data.doctorName ?? "—"}</td>
      )}

      {/* ✅ Clinic Name Second */}
      <td className="p-3 text-white/70">{data.clinic.name}</td>
      
      {role !== "customer" && (
        <td className="p-3">
            {data.assigneeUser ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-bold border border-blue-500/30">
                    {getInitials(data.assigneeUser.name, data.assigneeUser.email)}
                </div>
                <span className="text-white/70 text-xs truncate max-w-[100px]">
                {data.assigneeUser.name || data.assigneeUser.email.split("@")[0]}
                </span>
            </div>
            ) : (
            <span className="text-white/20 text-xs italic">—</span>
            )}
        </td>
      )}

      <td className="p-3 text-white/70">{data.toothCodes}</td>
      
      <td className="p-3 relative text-center">
         <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-opacity duration-200 ${getStatusColor(data.status)} ${
             (role === "customer" && data.status === "COMPLETED") ? "group-hover:opacity-20" : ""
          }`}
        >
          {data.status.replace(/_/g, " ")}
        </span>

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
      
      <td className="p-3 text-white/70">{fmtDate(data.dueDate)}</td>
      <td className="p-3 text-white/50">{fmtDate(data.createdAt)}</td> 
    </tr>
  );
}