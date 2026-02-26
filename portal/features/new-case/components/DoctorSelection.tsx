// portal/features/new-case/components/DoctorSelection.tsx
"use client";

import { useMemo } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { CaseData, DoctorRow, ServiceLevel } from "./types";

interface DoctorSelectionProps {
  doctors: DoctorRow[];
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

export default function DoctorSelection({ doctors, data, update }: DoctorSelectionProps) {
  
  // 1. Doctor Options
  const doctorOptions = useMemo(() => {
    return doctors.map((d) => ({
      id: d.id,
      label: d.name ? `${d.name} (${d.email})` : d.email,
      subLabel: d.clinic?.name || "No Clinic"
    }));
  }, [doctors]);

  // 2. Resolve Selected Doctor
  const selectedDoctor = useMemo(() => 
    doctors.find(d => d.id === data.doctorUserId), 
  [doctors, data.doctorUserId]);

  // 3. Resolve Available Clinics (Primary + Secondary)
  const availableClinics = useMemo(() => {
    if (!selectedDoctor) return [];
    
    const list = selectedDoctor.clinic ? [selectedDoctor.clinic] : [];
    
    if (selectedDoctor.secondaryClinics && selectedDoctor.secondaryClinics.length > 0) {
      selectedDoctor.secondaryClinics.forEach(sc => {
        if (!list.find(c => c.id === sc.id)) {
          list.push(sc);
        }
      });
    }
    return list;
  }, [selectedDoctor]);

  // 4. Handle Doctor Change
  const handleDoctorChange = (newId: string) => {
    const doc = doctors.find((d) => d.id === newId);

    if (doc) {
      const newPrefs = doc.preferenceNote || doc.defaultDesignPreferences || "";
      const clinics = doc.clinic ? [doc.clinic] : [];
      if (doc.secondaryClinics) clinics.push(...doc.secondaryClinics);
      
      let autoClinicId = "";
      let newServiceLevel: ServiceLevel = "STANDARD";

      // ✅ FIX: Force auto-select of the primary (or first available) clinic
      if (clinics.length > 0) {
        const targetClinic = doc.clinic || clinics[0];
        autoClinicId = targetClinic.id;
        if (targetClinic.priceTier === "IN_HOUSE") newServiceLevel = "IN_HOUSE";
      }

      update({
        doctorUserId: newId,
        doctorName: doc.name || doc.email,
        doctorPreferences: newPrefs,
        clinicId: autoClinicId,
        serviceLevel: newServiceLevel
      });
    }
  };

  // 5. Handle Clinic Change
  const handleClinicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClinicId = e.target.value;
    const targetClinic = availableClinics.find(c => c.id === newClinicId);
    
    let newServiceLevel: ServiceLevel = "STANDARD";
    if (targetClinic?.priceTier === "IN_HOUSE") {
      newServiceLevel = "IN_HOUSE";
    }

    update({ 
      clinicId: newClinicId,
      serviceLevel: newServiceLevel 
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-4 shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-lg font-medium text-foreground">Doctor & Clinic</h2>
        <span className="text-[10px] uppercase tracking-wider text-[#9696e2] font-bold bg-[#9696e2]/20 border border-[#9696e2]/30 dark:border-[#9696e2]/50 px-2 py-1 rounded">
          Required
        </span>
      </div>
      
      <SearchableSelect
        label="Select Doctor"
        placeholder="Search by name, email, or clinic..."
        options={doctorOptions}
        value={data.doctorUserId}
        onChange={handleDoctorChange}
      />

      {availableClinics.length > 0 && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Select Clinic <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <select
              value={data.clinicId || ""} // Fallback to empty string if undefined
              onChange={handleClinicChange}
              disabled={availableClinics.length === 1} 
              className={`w-full rounded-lg bg-surface-highlight border border-border px-4 py-3 text-foreground focus:border-accent/50 outline-none transition appearance-none 
                ${availableClinics.length === 1 ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--accent-dim)]"}`}
            >
              {/* ✅ ADDED: Placeholder option to catch edge cases */}
              <option value="" disabled>Select a clinic...</option>
              {availableClinics.map(c => (
                <option key={c.id} value={c.id} className="bg-surface-highlight">
                  {c.name} {c.priceTier === "IN_HOUSE" ? "(In-House)" : ""}
                </option>
              ))}
            </select>
            
            {availableClinics.length > 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            )}
          </div>
          
          {availableClinics.length === 1 && (
             <p className="text-[10px] text-muted pl-1 mt-1">
               Doctor is only associated with this clinic.
             </p>
          )}
        </div>
      )}
    </div>
  );
}