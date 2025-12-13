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
    setQuery(doc.email); // show chosen email
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
  const [shade, setShade] = useState("");
  const [material, setMaterial] = useState("");

  // Single required scan viewer HTML
  const [scanHtml, setScanHtml] = useState<File | null>(null);

  function friendly(e: unknown): string {
    const s = String((e as any)?.message || e || "");

    // Order date invalid
    if (/order date invalid/i.test(s)) {
      return "Invalid date. Please use the date picker (YYYY-MM-DD).";
    }

    // Doctor/clinic linkage issues
    if (/Doctor account not found/i.test(s)) {
      return "The selected doctor account could not be found.";
    }
    if (/Doctor has no clinic linked/i.test(s)) {
      return "The selected doctor isn’t linked to a clinic.";
    }

    // Backend: scan viewer HTML missing
    if (/Scan viewer HTML is required/i.test(s)) {
      return "Please upload a scan viewer HTML file.";
    }

    // Backend: wrong type
    if (/Scan viewer must be an HTML file/i.test(s)) {
      return "Scan viewer must be an HTML (.html) file.";
    }

    // Backend: size too large
    if (/Scan viewer file is too large/i.test(s)) {
      return "Scan viewer file is too large.";
    }

    return s || "Please correct the highlighted fields and try again.";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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
    if (!scanHtml) {
      return setErr("Please upload a scan viewer HTML file.");
    }

    const parsed = new Date(orderDate);
    if (isNaN(parsed.getTime())) {
      return setErr("Invalid date.");
    }

    const fd = new FormData();
    fd.append("patientAlias", alias.trim());
    fd.append("doctorUserId", doctorUserId);
    fd.append("toothCodes", tooth.trim());
    // API expects a string; it parses with new Date(orderDateRaw)
    fd.append("orderDate", new Date(orderDate).toISOString());
    fd.append("product", product);
    if (material) fd.append("material", material);
    if (shade) fd.append("shade", shade);
    // IMPORTANT: this is now HTML, not STL/PLY/OBJ
    fd.append("scanHtml", scanHtml);

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
        <div className="text-sm text-white/70">
          Doctor (search by email/name/clinic)
        </div>

        <div className="relative">
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="Start typing doctor email…"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyDoctor(d);
                      }}
                      className={[
                        "w-full text-left px-3 py-2 text-sm",
                        active ? "bg-white/15" : "hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium text-white">
                        {d.name || d.email}
                      </div>
                      <div className="text-xs text-white/70">{d.email}</div>
                      <div className="text-xs text-white/50">
                        {d.clinic.name}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-white/70">
          <div>
            <div className="text-white/50">Doctor Name</div>
            <div className="mt-0.5 text-white/90 truncate">
              {doctorNameDisplay || "—"}
            </div>
          </div>
          <div>
            <div className="text-white/50">Doctor Email</div>
            <div className="mt-0.5 text-white/90 truncate">
              {doctorEmailDisplay || "—"}
            </div>
          </div>
          <div>
            <div className="text-white/50">Clinic</div>
            <div className="mt-0.5 text-white/90 truncate">
              {clinicNameDisplay || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Patient + tooth */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm text-white/70 mb-1">Patient Alias</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g. JD-0425"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Tooth Codes</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g. 19, 20"
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
            <option value="MULTILAYER_ZIRCONIA">
              Multilayer Zirconia Crown
            </option>
            <option value="EMAX">Emax Crown</option>
            <option value="INLAY_ONLAY">Inlay/Onlay</option>
          </select>
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">Shade</div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g. A2"
            value={shade}
            onChange={(e) => setShade(e.target.value)}
          />
        </div>
        <div>
          <div className="text-sm text-white/70 mb-1">
            Material (optional)
          </div>
          <input
            className="w-full rounded-lg p-2 bg-black/40 border border-white/10 text-white"
            placeholder="e.g. Zirconia"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </div>
      </div>

      {/* Scan viewer HTML upload */}
      <div className="space-y-3">
        <div>
          <div className="text-sm text-white/70 mb-1">
            Upload Scan Viewer (Exocad HTML)
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg p-3 bg-black/40 border border-white/10 cursor-pointer">
            <div className="flex-1 min-w-0 text-white/80">
              {scanHtml ? (
                <>
                  <div
                    className="font-medium text-xs truncate"
                    title={scanHtml.name}
                  >
                    {scanHtml.name}
                  </div>
                  <div className="text-[10px] text-white/60">
                    {(scanHtml.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <div className="text-xs text-white/60 truncate">
                  Choose scan viewer HTML…
                </div>
              )}
            </div>
            <div className="shrink-0 rounded-md bg-white text-black px-3 py-1.5 text-xs">
              Browse
            </div>
            <input
              type="file"
              accept=".html,.htm,text/html"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setScanHtml(f);
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Errors / status */}
      {err && (
        <div className="text-sm text-red-400">
          {err}
        </div>
      )}
      {ok && (
        <div className="text-sm text-emerald-400">
          {ok}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create Case"}
      </button>
    </form>
  );
}
