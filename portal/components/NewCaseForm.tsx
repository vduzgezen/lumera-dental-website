// portal/components/NewCaseForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // ✅ Import useCallback
import { useRouter } from "next/navigation";
import { CaseData, INITIAL_DATA, DoctorRow, ServiceLevel } from "./new-case/types";

import DoctorSelection from "./new-case/DoctorSelection";
import CaseInfo from "./new-case/CaseInfo";
import TeethSelection from "./new-case/TeethSelection";
import ProductionFiles from "./new-case/ProductionFiles";

export default function NewCaseForm({ doctors }: { doctors: DoctorRow[] }) {
  const router = useRouter();
  const [data, setData] = useState<CaseData>(INITIAL_DATA);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  // ✅ PERFORMANCE FIX: Stabilize the update function
  const update = useCallback((fields: Partial<CaseData>) => {
    setData(prev => ({ ...prev, ...fields }));
  }, []);

  // ... (Rest of the file remains exactly the same)
  // Just copy the rest of the file content below:

  // ✅ AUTO-SELECT: On load, pick first doctor and handle their clinics
  useEffect(() => {
    if (!data.doctorUserId && doctors.length > 0) {
      const first = doctors[0];
      const prefs = first.preferenceNote || first.defaultDesignPreferences || "";
      
      const clinics = first.clinic ? [first.clinic, ...first.secondaryClinics] : [...first.secondaryClinics];
      
      let initialClinicId = "";
      let initialLevel: ServiceLevel = "STANDARD";

      if (clinics.length === 1) {
        initialClinicId = clinics[0].id;
        if (clinics[0].priceTier === "IN_HOUSE") initialLevel = "IN_HOUSE";
      }

      update({
        doctorUserId: first.id,
        doctorName: first.name || first.email,
        designPreferences: prefs,
        clinicId: initialClinicId,
        serviceLevel: initialLevel
      });
    }
  }, [doctors, update]); // ✅ Added update to dependency

  // Auto-Alias
  useEffect(() => {
    const last = (data.patientLastName || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).padEnd(2, "X");
    const first = (data.patientFirstName || "XX").replace(/[^a-zA-Z]/g, "").slice(0, 2).padEnd(2, "X");
    const color = (data.shade || "NO").replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).padEnd(2, "X");
    const prod = (data.product || "XX").slice(0, 2);
    const generated = `${last}${first}${color}${prod}00`.toUpperCase();

    if (data.patientAlias !== generated) {
       update({ patientAlias: generated });
    }
  }, [data.patientLastName, data.patientFirstName, data.shade, data.product, update]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setOk(undefined);

    if (!data.doctorUserId) return setErr("Please select a doctor account.");
    if (!data.clinicId) return setErr("Please select a clinic.");
    if (!data.patientFirstName.trim() || !data.patientLastName.trim()) return setErr("Patient Name is required.");
    if (data.toothCodes.length === 0) return setErr("Please select at least one tooth.");
    if (!data.scanHtml) return setErr("Please upload a scan viewer HTML file.");
    if (!data.rxPdf) return setErr("Please upload the Rx PDF.");
    
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("patientAlias", data.patientAlias);
      fd.append("patientFirstName", data.patientFirstName);
      fd.append("patientLastName", data.patientLastName);
      fd.append("doctorUserId", data.doctorUserId);
      fd.append("clinicId", data.clinicId);
      fd.append("toothCodes", data.toothCodes.join(",")); 
      
      fd.append("orderDate", new Date(data.orderDate).toISOString());
      fd.append("dueDate", new Date(data.dueDate).toISOString());

      fd.append("product", data.product);
      if (data.material) fd.append("material", data.material);
      fd.append("serviceLevel", data.serviceLevel);
      if (data.shade) fd.append("shade", data.shade);
      if (data.designPreferences) fd.append("designPreferences", data.designPreferences);

      if (data.scanHtml) fd.append("scanHtml", data.scanHtml);
      if (data.rxPdf) fd.append("rxPdf", data.rxPdf);
      if (data.constructionInfo) fd.append("constructionInfo", data.constructionInfo);
      if (data.modelTop) fd.append("modelTop", data.modelTop);
      if (data.modelBottom) fd.append("modelBottom", data.modelBottom);

      const r = await fetch("/api/cases/new", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Create failed");

      setOk("Case created. Redirecting…");
      router.push(`/portal/cases/${encodeURIComponent(j.id)}`);
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto overflow-y-auto custom-scrollbar pr-2 pb-20">
      <form onSubmit={submit} className="space-y-6">
        <DoctorSelection doctors={doctors} data={data} update={update} />
        <CaseInfo data={data} update={update} />
        <TeethSelection data={data} update={update} />
        <ProductionFiles data={data} update={update} />

        <div className="flex flex-col items-end gap-3 pt-6 border-t border-white/10">
          {err && <p className="text-red-400 text-sm font-medium bg-red-500/10 px-3 py-1 rounded">{err}</p>}
          {ok && <p className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded">{ok}</p>}
          
          <button
            type="submit"
            disabled={busy}
            className="px-8 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {busy ? "Creating Case..." : "Create Case"}
          </button>
        </div>
      </form>
    </div>
  );
}