// features/case-dashboard/components/PreferencesTab.tsx
"use client";

import CaseNotesEditor from "@/components/CaseNotesEditor";

type Props = {
  caseId: string;
  doctorPreferences?: string | null;
  caseNotes?: string | null;
  role: string;
  isActive: boolean;
};

export default function PreferencesTab({ caseId, doctorPreferences, caseNotes, role, isActive }: Props) {
  if (!isActive) return null;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 animate-in fade-in duration-200 min-h-0">
      
      {/* Top Half: Doctor Preferences (Strictly Read-Only, Blends with Background) */}
      <div className="flex-1 flex flex-col min-h-0 space-y-2">
        <h4 className="text-xs font-bold text-accent uppercase tracking-wider shrink-0">Doctor Preferences</h4>
        {doctorPreferences ? (
          <div className="flex-1 bg-transparent border border-border rounded-lg p-4 overflow-y-auto custom-scrollbar transition-colors duration-200">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{doctorPreferences}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-transparent border border-border border-dashed rounded-lg text-muted text-sm italic transition-colors duration-200">
            No preferences set for this case.
          </div>
        )}
      </div>
      
      {/* Bottom Half: Designer Notes (Editable, Pure White in Light Mode) */}
      <div className="flex-1 flex flex-col min-h-0">
        <CaseNotesEditor caseId={caseId} initialNotes={caseNotes || null} role={role} />
      </div>
      
    </div>
  );
}