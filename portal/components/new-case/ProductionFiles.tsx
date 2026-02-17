// portal/components/new-case/ProductionFiles.tsx
"use client";

import { useRef } from "react";
import { CaseData } from "./types";
import { useTheme } from "@/components/ThemeProvider";

interface ProductionFilesProps {
  data: CaseData;
  update: (fields: Partial<CaseData>) => void;
}

const CustomFileInput = ({ 
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
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end gap-2 overflow-hidden">
        <label className="text-xs font-medium text-muted uppercase tracking-wider shrink-0">
          {label} {req && <span className="text-accent">*</span>}
        </label>
        
        {file && (
          <span className="text-[10px] text-emerald-400 font-mono truncate min-w-0" title={file.name}>
            ✓ {file.name}
          </span>
        )}
      </div>
      
      {/* Custom Trigger Area */}
      <div 
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-between gap-3 rounded-lg p-2 bg-surface-highlight border border-border cursor-pointer hover:border-accent/30 transition-colors duration-200 group"
      >
        <span className="text-sm text-foreground/50 truncate pl-1">
            {file ? file.name : "No file chosen..."}
        </span>

        {/* ✅ THE FIX: A real button, styled explicitly */}
        <button
            type="button"
            className="px-3 py-1.5 rounded text-xs font-bold bg-accent hover:bg-accent/80 transition-colors"
            style={{ color: isDark ? 'white' : 'black' }}
        >
            Browse
        </button>

        <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            className="hidden" // Completely hide the native input
        />
      </div>
    </div>
  );
};

export default function ProductionFiles({ data, update }: ProductionFilesProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-4 shadow-lg">
      <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">
         Production Files
      </h2>
      <div className="grid grid-cols-1 gap-6">
         <div className="grid md:grid-cols-2 gap-6">
            <CustomFileInput 
              label="Scan Viewer (HTML)" 
              file={data.scanHtml} 
              accept=".html" 
              req={true} 
              onChange={(f) => update({ scanHtml: f })} 
            />
            <CustomFileInput 
              label="Rx PDF" 
              file={data.rxPdf} 
              accept=".pdf" 
              req={true} 
              onChange={(f) => update({ rxPdf: f })} 
            />
         </div>

         <div className="w-full h-px bg-border" />

         <div>
            <span className="text-[10px] uppercase tracking-wider text-muted mb-2 block">
              Optional now (Required before Milling)
            </span>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CustomFileInput 
                  label="Construction Info" 
                  file={data.constructionInfo} 
                  accept=".pdf,.xml,.txt,.constructionInfo" 
                  onChange={(f) => update({ constructionInfo: f })} 
                />
                <CustomFileInput 
                  label="Model Top (STL)" 
                  file={data.modelTop} 
                  accept=".stl,.ply" 
                  onChange={(f) => update({ modelTop: f })} 
                />
                <CustomFileInput 
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