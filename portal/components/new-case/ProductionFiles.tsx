// portal/components/new-case/ProductionFiles.tsx
"use client";

import { CaseData } from "./types";

interface ProductionFilesProps {
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

// Reusable File Input Sub-component
const FileInput = ({ 
  label, 
  file, 
  accept, 
  req = false,
  onChange 
}: { 
  label: string, 
  file: File | null, 
  accept: string, 
  req?: boolean,
  onChange: (f: File | null) => void 
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-end gap-2 overflow-hidden">
      <label className="text-xs font-medium text-white/70 uppercase tracking-wider shrink-0">
        {label} {req && <span className="text-blue-400">*</span>}
      </label>
      
      {/* ✅ FIX: CSS Truncation ensures this never breaks layout */}
      {file && (
        <span className="text-[10px] text-emerald-400 font-mono truncate min-w-0" title={file.name}>
          ✓ {file.name}
        </span>
      )}
    </div>
    
    <div className="relative group">
      <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="
          w-full text-sm text-white/60
          file:mr-4 file:py-2.5 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-600 file:text-white
          hover:file:bg-blue-500 file:transition-colors
          cursor-pointer bg-black/40 rounded-lg border border-white/10 p-2
          "
      />
    </div>
  </div>
);

export default function ProductionFiles({ data, update }: ProductionFilesProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-4 shadow-lg">
      <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
         Production Files
      </h2>
      <div className="grid grid-cols-1 gap-6">
         {/* Mandatory at Start */}
         <div className="grid md:grid-cols-2 gap-6">
            <FileInput 
              label="Scan Viewer (HTML)" 
              file={data.scanHtml} 
              accept=".html" 
              req={true} 
              onChange={(f) => update({ scanHtml: f })} 
            />
            <FileInput 
              label="Rx PDF" 
              file={data.rxPdf} 
              accept=".pdf" 
              req={true} 
              onChange={(f) => update({ rxPdf: f })} 
            />
         </div>

         <div className="w-full h-px bg-white/5" />

         {/* Optional / Construction Files */}
         <div>
            <span className="text-[10px] uppercase tracking-wider text-white/40 mb-2 block">
              Optional now (Required before Milling)
            </span>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FileInput 
                  label="Construction Info" 
                  file={data.constructionInfo} 
                  accept=".pdf,.xml,.txt,.constructionInfo" 
                  onChange={(f) => update({ constructionInfo: f })} 
                />
                <FileInput 
                  label="Model Top (STL)" 
                  file={data.modelTop} 
                  accept=".stl,.ply" 
                  onChange={(f) => update({ modelTop: f })} 
                />
                <FileInput 
                  label="Model Bottom (STL)" 
                  file={data.modelBottom} 
                  accept=".stl,.ply" 
                  onChange={(f) => update({ modelBottom: f })} 
                />
            </div>
         </div>
      </div>
    </div>
  );
}