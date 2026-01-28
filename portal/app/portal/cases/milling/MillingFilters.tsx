// portal/app/portal/cases/milling/MillingFilters.tsx
"use client";

interface Props {
  statusFilter: Set<string>;
  toggleStatus: (s: string) => void;
  
  showShipped: boolean;
  setShowShipped: (v: boolean) => void;
  
  doctorFilter: string;
  setDoctorFilter: (v: string) => void;
  uniqueDoctors: string[];
  
  zipFilter: string;
  setZipFilter: (v: string) => void;
  uniqueZips: string[];
  
  onClear: () => void;
}

export default function MillingFilters({
  statusFilter, toggleStatus,
  showShipped, setShowShipped,
  doctorFilter, setDoctorFilter, uniqueDoctors,
  zipFilter, setZipFilter, uniqueZips,
  onClear
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
      {/* Status Checkboxes */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={statusFilter.has("APPROVED")} 
            onChange={() => toggleStatus("APPROVED")} 
            className="accent-emerald-500" 
          />
          Approved
        </label>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={statusFilter.has("IN_MILLING")} 
            onChange={() => toggleStatus("IN_MILLING")} 
            className="accent-purple-500" 
          />
          In Milling
        </label>
      </div>

      <div className="w-px h-6 bg-white/10 mx-2" />

      <select
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        value={doctorFilter}
        onChange={(e) => setDoctorFilter(e.target.value)}
      >
        <option value="ALL">All Doctors</option>
        {uniqueDoctors.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        value={zipFilter}
        onChange={(e) => setZipFilter(e.target.value)}
      >
        <option value="ALL">All Zip Codes</option>
        {uniqueZips.map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      <div className="w-px h-6 bg-white/10 mx-2" />

      <label className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white cursor-pointer select-none hover:bg-white/5 transition">
        <input 
            type="checkbox" 
            checked={showShipped} 
            onChange={() => setShowShipped(!showShipped)} 
            className="accent-blue-500" 
        />
        Show Shipped
      </label>

      {(doctorFilter !== "ALL" || zipFilter !== "ALL") && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          Clear
        </button>
      )}
    </div>
  );
}