// portal/components/NewCaseForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Doctor, NewCaseState } from "./new-case/types";

// Imported Refactored Blocks
import DoctorSelection from "./new-case/DoctorSelection";
import CaseInfo from "./new-case/CaseInfo";
import Prescription from "./new-case/Prescription";
import ProductionFiles from "./new-case/ProductionFiles";
import TeethSelection from "./new-case/TeethSelection";

function getPref(d?: Doctor) {
  if (!d) return "";
  return d.preferenceNote || d.defaultDesignPreferences || "";
}

function friendly(e: unknown): string {
  const s = String((e as any)?.message || e || "");
  if (/order date invalid/i.test(s)) return "Invalid date. Please use the date picker.";
  return s || "Please correct the highlighted fields and try again.";
}

export default function NewCaseForm({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Initial State
  const [formData, setFormData] = useState<NewCaseState>({
    doctorUserId: doctors[0]?.id || "",
    patientAlias: "",
    toothCodes: "",
    orderDate: new Date().toISOString().split("T")[0],
    product: "ZIRCONIA",
    shade: "",
    material: "",
    designPreferences: getPref(doctors[0]),
    scanHtml: null,
    rxPdf: null,
    constructionInfo: null,
    modelTop: null,
    modelBottom: null,
  });

  // State Update Helper
  const updateState = (updates: Partial<NewCaseState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setErr(null);
  };

  // Special handler for Doctor change to auto-fill prefs
  const handleDoctorChange = (id: string) => {
    const doc = doctors.find((d) => d.id === id);
    updateState({ 
        doctorUserId: id,
        designPreferences: doc ? getPref(doc) : formData.designPreferences
    });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // Validation
    if (!formData.doctorUserId) return setErr("Please select a doctor account.");
    if (!formData.patientAlias.trim()) return setErr("Alias is required.");
    if (!formData.toothCodes.trim()) return setErr("Tooth codes are required.");
    if (!formData.scanHtml) return setErr("Please upload a scan viewer HTML file.");
    if (!formData.rxPdf) return setErr("Please upload the Rx PDF.");

    setBusy(true);

    try {
      const fd = new FormData();
      // Text Fields
      fd.append("patientAlias", formData.patientAlias.trim());
      fd.append("doctorUserId", formData.doctorUserId);
      fd.append("toothCodes", formData.toothCodes.trim());
      fd.append("orderDate", new Date(formData.orderDate).toISOString());
      fd.append("product", formData.product);
      if (formData.material) fd.append("material", formData.material);
      if (formData.shade) fd.append("shade", formData.shade);
      if (formData.designPreferences) fd.append("designPreferences", formData.designPreferences);

      // Files
      if (formData.scanHtml) fd.append("scanHtml", formData.scanHtml);
      if (formData.rxPdf) fd.append("rxPdf", formData.rxPdf);
      if (formData.constructionInfo) fd.append("constructionInfo", formData.constructionInfo);
      if (formData.modelTop) fd.append("modelTop", formData.modelTop);
      if (formData.modelBottom) fd.append("modelBottom", formData.modelBottom);

      const r = await fetch("/api/cases/new", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      
      if (!r.ok) throw new Error(j.error || "Create failed");
      
      setOk("Case created. Redirecting…");
      router.push(`/portal/cases/${encodeURIComponent(j.id)}`);
    } catch (e: any) {
      setErr(friendly(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto overflow-y-auto custom-scrollbar pr-2 pb-20">
      <form onSubmit={submit} className="space-y-6">
        
        {/* 1. Doctor */}
        <DoctorSelection 
            doctors={doctors} 
            selectedId={formData.doctorUserId} 
            onChange={handleDoctorChange} 
        />

        {/* 2. Info */}
        <CaseInfo data={formData} onChange={updateState} />

        {/* 3. Prescription */}
        <Prescription data={formData} onChange={updateState} />

        {/* 4. Files */}
        <ProductionFiles data={formData} onChange={updateState} />

        {/* 5. Teeth */}
        <TeethSelection value={formData.toothCodes} onChange={(val) => updateState({ toothCodes: val })} />

        {/* Footer Actions */}
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