// portal/components/new-case/DoctorSelection.tsx
"use client";

import { useMemo } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { Doctor } from "./types";

interface Props {
  doctors: Doctor[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function DoctorSelection({ doctors, selectedId, onChange }: Props) {
  const options = useMemo(() => {
    return doctors.map((d) => ({
      id: d.id,
      label: d.name ? `${d.name} (${d.email})` : d.email,
      subLabel: d.clinic.name
    }));
  }, [doctors]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h2 className="text-lg font-medium text-white/90">Doctor Assignment</h2>
        <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
          Required
        </span>
      </div>
      <SearchableSelect
        label="Select Doctor"
        placeholder="Search by name, email, or clinic..."
        options={options}
        value={selectedId}
        onChange={onChange}
      />
    </div>
  );
}