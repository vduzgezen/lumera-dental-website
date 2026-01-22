// portal/components/new-case/TeethSelection.tsx
"use client";

import ToothSelector from "@/components/ToothSelector";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function TeethSelection({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
       <h2 className="text-lg font-medium text-white/90 px-1">Select Teeth *</h2>
       <ToothSelector value={value} onChange={onChange} />
    </div>
  );
}