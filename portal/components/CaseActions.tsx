// portal/components/CaseActions.tsx
"use client";

type Props = {
  caseId: string;
  role: "customer" | "lab" | "admin";
  currentStatus: string;
};

export default function CaseActions({ caseId, role, currentStatus }: Props) {
  async function change(to: string) {
    const r = await fetch(`/api/cases/${caseId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }), 
    });
    
    if (r.ok) window.location.reload();
    else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Action failed");
    }
  }

  const isApproved = 
    currentStatus === "APPROVED" || 
    currentStatus === "IN_MILLING" || 
    currentStatus === "SHIPPED" ||
    currentStatus === "COMPLETED";
  
  const canCustomer = new Set(["APPROVED", "CHANGES_REQUESTED"]);
  
  const showApprove = !isApproved && (role !== "customer" || canCustomer.has("APPROVED"));
  const showRequest = !isApproved && (role !== "customer" || canCustomer.has("CHANGES_REQUESTED"));

  if (isApproved) return null; 

  return (
    <div className="flex items-center gap-2">
      {showRequest && (
        <button 
          onClick={() => change("CHANGES_REQUESTED")} 
          className="px-3 py-1.5 rounded-md border border-white/20 hover:bg-white/10 transition text-white text-xs font-medium"
        >
          Request Changes
        </button>
      )}
      {showApprove && (
        <button 
          onClick={() => change("APPROVED")} 
          className="px-3 py-1.5 rounded-md bg-white text-black text-xs font-bold hover:bg-gray-200 transition shadow-lg shadow-white/5"
        >
          Approve Design
        </button>
      )}
    </div>
  );
}