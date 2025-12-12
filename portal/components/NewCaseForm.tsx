// components/NewCaseForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Doctor = {
  id: string;
  email: string;
  name: string | null;
  clinic: { id: string; name: string };
};

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

export default function NewCaseForm({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  const [alias, setAlias] = useState("");
  const [tooth, setTooth] = useState("");

  // Doctor selection + typeahead
  const [doctorUserId, setDoctorUserId] = useState(doctors[0]?.id ?? "");
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorUserId) ?? null,
    [doctorUserId, doctors],
  );

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => {
      const email = d.email.toLowerCase();
      const name = (d.name ?? "").toLowerCase();
      const clinic = d.clinic.name.toLowerCase();
      return (
        email.includes(q) ||
        name.includes(q) ||
        clinic.includes(q)
      );
    });
  }, [query, doctors]);

  function applyDoctor(doc: Doctor) {
    setDoctorUserId(doc.id);
    setQuery(doc.email); // show the chosen email in the search box
    setDropdownOpen(false);
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setDropdownOpen(true);
    setHighlightIndex(0);
  }

  function handleQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || filteredDoctors.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev + 1 >= filteredDoctors.length ? filteredDoctors.length - 1 : prev + 1,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const doc = filteredDoctors[highlightIndex];
      if (doc) applyDoctor(doc);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  }

  const today = useMemo(() => new Date(), []);
  const [orderDate, setOrderDate] = useState(toISODate(today));
  const dueDate = useMemo(
    () => toISODate(addDays(new Date(orderDate), 8)),
    [orderDate],
  );

  const [product, setProduct] = useState<
    "ZIRCONIA" | "MULTILAYER_ZIRCONIA" | "EMAX" | "INLAY_ONLAY"
  >("ZIRCONIA");
  const [material, setMaterial] = useState("");
  const [shade, setShade] = useState("");
  const [scan, setScan] = useState<File | null>(null);

  function friendly(e: unknown): string {
    const s = String((e as any)?.message || e || "");
    if (/order date/i.test(s)) {
      return "Invalid date. Please use the date picker (YYYY-MM-DD).";
    }
    if (/Doctor/.test(s) && /clinic/.test(s)) {
      return "The selected doctor isn’t linked to a clinic.";
    }
    if (/Scan must be/.test(s)) {
      return "Scan must be STL, PLY, or OBJ.";
    }
    if (/too large/i.test(s)) {
      return "Scan file is too large (max ~200MB).";
    }
    return s || "Please correct the highlighted fields and try again.";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setOk(undefined);

    if (!doctorUserId) {
      return setErr("Please select a doctor account.");
    }
    if (!alias.trim()) {
      return setErr("Alias is required.");
    }
    if (!tooth.trim()) {
      return setErr("Tooth codes are required.");
    }
    if (!scan) {
      return setErr("Scan file is required (STL / PLY / OBJ).");
    }

    const parsed = new Date(orderDate);
    if (isNaN(parsed.getTime())) {
      return setErr("Invalid order date.");
    }

    const fd = new FormData();
    fd.append("patientAlias", alias.trim());
    fd.append("doctorUserId", doctorUserId);
    fd.append("toothCodes", tooth.trim());
    fd.append("orderDate", new Date(orderDate).toISOString());
    fd.append("product", product);
    if (material) fd.append("material", material);
    if (shade) fd.append("shade", shade);
    fd.append("scan", scan);

    setBusy(true);
    try {
      const r = await fetch("/api/cases/new", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Create failed");
      setOk("Case created. Redirecting…");
      router.push(`/portal/cases/${encodeURIComponent(j.id)}`);
    } catch (e: any) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  }

  const doctorNameDisplay = selectedDoctor?.name ?? "";
  const doctorEmailDisplay = selectedDoctor?.email ?? "";
  const clinicNameDisplay = selectedDoctor?.clinic.name ?? "";

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      {/* Doctor picker */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
        <div className="text-sm text-white/70">Doctor (search by email/name/clinic)</div>

        <div className="relative">
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="Start typing doctor email…"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
              // small delay so clicks on the menu still register
              setTimeout(() => setDropdownOpen(false), 120);
            }}
            onKeyDown={handleQueryKeyDown}
          />

          {dropdownOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-black/90 shadow-xl">
              {filteredDoctors.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/60">
                  No doctors match “{query.trim()}”.
                </div>
              ) : (
                filteredDoctors.map((d, idx) => {
                  const active = idx === highlightIndex;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between ${
                        active ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                      onMouseDown={(ev) => {
                        // prevent blur so selection works smoothly
                        ev.preventDefault();
                        applyDoctor(d);
                      }}
                    >
                      <span className="font-medium text-white truncate">
                        {d.email}
                      </span>
                      <span className="text-xs text-white/60 sm:ml-3 truncate">
                        {d.name ? `${d.name} • ${d.clinic.name}` : d.clinic.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Snapshot of the linked doctor/clinic */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-white/60 mb-1">Doctor name</div>
            <input
              className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white/80 text-sm"
              value={doctorNameDisplay}
              readOnly
              placeholder="Select a doctor…"
            />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Doctor email</div>
            <input
              className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white/80 text-sm"
              value={doctorEmailDisplay}
              readOnly
              placeholder="Select a doctor…"
            />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Clinic</div>
            <input
              className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white/80 text-sm"
              value={clinicNameDisplay}
              readOnly
              placeholder="Clinic is set automatically"
            />
          </div>
        </div>

        <p className="text-xs text-white/50">
          The clinic is pulled from the doctor account and will be used for the new
          case automatically.
        </p>
      </div>

      {/* Case basics */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm text-white/70 mb-1">Alias</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="Patient alias (e.g., JD-0425)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Tooth Codes</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g., 19, 20"
            value={tooth}
            onChange={(e) => setTooth(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm text-white/70 mb-1">Date of Order</div>
          <input
            type="date"
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Due Date (auto)</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            value={dueDate}
            readOnly
            disabled
          />
        </div>
      </div>

      {/* Product + material */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-sm text-white/70 mb-1">Product</div>
          <select
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            value={product}
            onChange={(e) => setProduct(e.target.value as any)}
          >
            <option value="ZIRCONIA">Zirconia Crown</option>
            <option value="MULTILAYER_ZIRCONIA">Multilayer Zirconia Crown</option>
            <option value="EMAX">Emax Crown</option>
            <option value="INLAY_ONLAY">Inlay/Onlay</option>
          </select>
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Shade</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g., A2"
            value={shade}
            onChange={(e) => setShade(e.target.value)}
          />
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Material (optional)</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g., Zirconia"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </div>
      </div>

      {/* Scan upload */}
      <div>
        <div className="text-sm text-white/70 mb-1">
          Upload Scan (STL / PLY / OBJ)
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg p-3 bg-black/40 border border-white/10 cursor-pointer">
          <div className="flex-1 text-white/80">
            {scan ? (
              <>
                <div className="font-medium truncate">{scan.name}</div>
                <div className="text-xs text-white/60">
                  {(scan.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </>
            ) : (
              <div className="text-white/60">Choose a file…</div>
            )}
          </div>
          <div className="shrink-0 rounded-md bg-white text-black px-3 py-1.5 text-sm">
            Browse
          </div>
          <input
            type="file"
            accept=".stl,.ply,.obj"
            onChange={(e) => setScan(e.target.files?.[0] || null)}
            className="hidden"
            required
          />
        </label>
        <p className="text-xs text-white/50 mt-1">
          You can re-upload the scan later from the case detail page while the case
          is in DESIGN.
        </p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      {ok && <p className="text-emerald-400 text-sm">{ok}</p>}

      <button
        disabled={busy}
        className="rounded-lg px-4 py-2 bg-white text-black disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create Case"}
      </button>
    </form>
  );
}
