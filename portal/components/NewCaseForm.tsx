// portal/components/NewCaseForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ToothSelector from "@/components/ToothSelector";
import SearchableSelect from "@/components/SearchableSelect";
import type { DoctorRow } from "@/app/portal/cases/new/page";

// --- HELPERS ---

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function friendly(e: unknown): string {
  const s = String((e as any)?.message || e || "");
  if (/order date invalid/i.test(s)) return "Invalid date. Please use the date picker.";
  return s || "Please correct the highlighted fields and try again.";
}

// Helper to coalesce preferences
function getPref(d?: DoctorRow) {
  if (!d) return "";
  return d.preferenceNote || d.defaultDesignPreferences || "";
}

const PRODUCTS = ["ZIRCONIA", "MULTILAYER_ZIRCONIA", "EMAX", "INLAY_ONLAY"];

// --- COMPONENT ---

export default function NewCaseForm({ doctors }: { doctors: DoctorRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  // --- FORM STATE ---
  const [doctorUserId, setDoctorUserId] = useState(doctors[0]?.id ?? "");
  const [alias, setAlias] = useState("");
  const [tooth, setTooth] = useState(""); 
  
  // Date Logic
  const today = useMemo(() => new Date(), []);
  const [orderDate, setOrderDate] = useState(toISODate(today));
  
  const dueDate = useMemo(() => {
    const d = new Date(orderDate);
    if (isNaN(d.getTime())) return "";
    return toISODate(addDays(d, 8));
  }, [orderDate]);

  // Rx Details
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [shade, setShade] = useState("");
  const [material, setMaterial] = useState("");
  
  // Initialize with the first doctor's preference note (checking both fields)
  const [designPreferences, setDesignPreferences] = useState(getPref(doctors[0])); 

  // File Inputs
  const [scanHtml, setScanHtml] = useState<File | null>(null);
  const [rxPdf, setRxPdf] = useState<File | null>(null);
  // Optional at start:
  const [constructionInfo, setConstructionInfo] = useState<File | null>(null);
  const [modelTop, setModelTop] = useState<File | null>(null);
  const [modelBottom, setModelBottom] = useState<File | null>(null);

  // --- HANDLERS ---
  
  function handleDoctorChange(newId: string) {
    setDoctorUserId(newId);
    // Find the doctor and update preferences to their default
    const doc = doctors.find((d) => d.id === newId);
    if (doc) {
        setDesignPreferences(getPref(doc));
    }
  }

  // --- SUBMISSION ---
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setOk(undefined);

    if (!doctorUserId) return setErr("Please select a doctor account.");
    if (!alias.trim()) return setErr("Alias is required.");
    if (!tooth.trim()) return setErr("Tooth codes are required.");
    
    // Mandatory Files at Creation: Only Scan HTML & Rx PDF
    if (!scanHtml) return setErr("Please upload a scan viewer HTML file.");
    if (!rxPdf) return setErr("Please upload the Rx PDF.");

    const fd = new FormData();
    fd.append("patientAlias", alias.trim());
    fd.append("doctorUserId", doctorUserId);
    fd.append("toothCodes", tooth.trim());
    fd.append("orderDate", new Date(orderDate).toISOString());
    fd.append("product", product);
    if (material) fd.append("material", material);
    if (shade) fd.append("shade", shade);
    if (designPreferences) fd.append("designPreferences", designPreferences); 
    
    // Append Files
    if (scanHtml) fd.append("scanHtml", scanHtml);
    if (rxPdf) fd.append("rxPdf", rxPdf);
    if (constructionInfo) fd.append("constructionInfo", constructionInfo);
    if (modelTop) fd.append("modelTop", modelTop);
    if (modelBottom) fd.append("modelBottom", modelBottom);

    setBusy(true);

    try {
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

  const doctorOptions = useMemo(() => {
    return doctors.map((d) => ({
      id: d.id,
      label: d.name ? `${d.name} (${d.email})` : d.email,
      subLabel: d.clinic.name
    }));
  }, [doctors]);

  // Helper for file inputs
  const FileInput = ({ label, setter, file, accept, req = false }: { label: string, setter: (f: File | null) => void, file: File | null, accept: string, req?: boolean }) => (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-medium text-white/70 uppercase tracking-wider">{label} {req && <span className="text-blue-400">*</span>}</label>
        {file && <span className="text-[10px] text-emerald-400 font-mono">✓ {file.name.slice(0, 20)}...</span>}
      </div>
      <div className="relative group">
        <input
            type="file"
            accept={accept}
            onChange={(e) => setter(e.target.files?.[0] || null)}
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

  return (
    <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto overflow-y-auto custom-scrollbar pr-2 pb-20">
      <form onSubmit={submit} className="space-y-6">

        {/* 1. DOCTOR ASSIGNMENT */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-lg font-medium text-white/90">Doctor Assignment</h2>
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">Required</span>
          </div>
          <SearchableSelect
            label="Select Doctor"
            placeholder="Search by name, email, or clinic..."
            options={doctorOptions}
            value={doctorUserId}
            onChange={handleDoctorChange} // Use wrapper handler
          />
        </div>

        {/* 2. CASE INFORMATION */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-6 shadow-lg">
          <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
            Case Information
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Patient Alias / ID</label>
              <input
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. JD-0425"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Date of Order</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Due Date (Auto +8 Days)</label>
              <input
                readOnly
                disabled
                value={dueDate}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 3. PRESCRIPTION DETAILS */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-6 shadow-lg">
          <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
            Prescription
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition appearance-none"
              >
                 {PRODUCTS.map(p => <option key={p} value={p} className="bg-gray-900">{p.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Shade (e.g. A2)</label>
              <input
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                placeholder="A2"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Material (Optional)</label>
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Zirconia"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition"
              />
            </div>
          </div>

          {/* NEW: Designer Preferences */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-white/70">Designer Preferences</label>
                <span className="text-[10px] text-white/40">Auto-filled from doctor profile</span>
            </div>
            <textarea
              value={designPreferences}
              onChange={(e) => setDesignPreferences(e.target.value)}
              placeholder="E.g. Contacts heavy, light occlusion, open embrasures..."
              className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 outline-none transition h-24 resize-none"
            />
          </div>
        </div>

        {/* 4. FILE UPLOADS (Updated for Milling Workflow) */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 space-y-4 shadow-lg">
          <h2 className="text-lg font-medium text-white/90 border-b border-white/5 pb-2">
             Production Files
          </h2>
          <div className="grid grid-cols-1 gap-6">
             {/* Mandatory at Start */}
             <div className="grid md:grid-cols-2 gap-6">
                <FileInput label="Scan Viewer (HTML)" setter={setScanHtml} file={scanHtml} accept=".html" req={true} />
                <FileInput label="Rx PDF" setter={setRxPdf} file={rxPdf} accept=".pdf" req={true} />
             </div>

             <div className="w-full h-px bg-white/5" />

             {/* Optional at Start (Mandatory for Milling) */}
             <div>
                <span className="text-[10px] uppercase tracking-wider text-white/40 mb-2 block">Optional now (Required before Milling)</span>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FileInput label="Construction Info" setter={setConstructionInfo} file={constructionInfo} accept=".pdf,.xml,.txt" />
                    <FileInput label="Model Top (STL)" setter={setModelTop} file={modelTop} accept=".stl,.ply" />
                    <FileInput label="Model Bottom (STL)" setter={setModelBottom} file={modelBottom} accept=".stl,.ply" />
                </div>
             </div>
          </div>
        </div>

        {/* 5. ODONTOGRAM - PRESERVED EXACTLY AS REQUESTED */}
        <div className="space-y-2">
           <h2 className="text-lg font-medium text-white/90 px-1">Select Teeth *</h2>
           <ToothSelector value={tooth} onChange={setTooth} />
        </div>

        {/* STATUS & SUBMIT */}
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