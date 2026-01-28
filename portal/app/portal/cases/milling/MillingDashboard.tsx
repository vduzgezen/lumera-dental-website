// portal/app/portal/cases/milling/MillingDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { CaseRow } from "../page";
import MillingHeader from "./MillingHeader";
import MillingFilters from "./MillingFilters";
import MillingTable from "./MillingTable";
import ShippingModal from "./ShippingModal";

// Define type locally or in a types file
type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

interface MillingDashboardProps {
  cases: CaseRow[];
}

export default function MillingDashboard({ cases }: MillingDashboardProps) {
  // --- STATE ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // Filters
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(["APPROVED", "IN_MILLING"]));
  const [showShipped, setShowShipped] = useState(false);
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [zipFilter, setZipFilter] = useState("ALL");
  
  // Loading
  const [isDownloading, setIsDownloading] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [isSavingShipment, setIsSavingShipment] = useState(false);

  // --- DERIVED DATA ---
  const uniqueDoctors = useMemo(() => {
    const doctors = new Set(
      cases.map(c => c.doctorUser?.name || c.doctorName).filter((name): name is string => !!name)
    );
    return Array.from(doctors).sort();
  }, [cases]);

  const uniqueZips = useMemo(() => {
    const zips = new Set(
      cases.map(c => c.doctorUser?.address?.zipCode).filter((zip): zip is string => !!zip)
    );
    return Array.from(zips).sort();
  }, [cases]);

  // --- FILTERING ---
  const filteredCases = cases.filter(c => {
    const isVisibleStatus = statusFilter.has(c.status) || (c.status === "SHIPPED" && showShipped);
    if (!isVisibleStatus) return false;

    if (doctorFilter !== "ALL") {
      const docName = c.doctorUser?.name || c.doctorName;
      if (docName !== doctorFilter) return false;
    }

    if (zipFilter !== "ALL") {
      const zip = c.doctorUser?.address?.zipCode;
      if (zip !== zipFilter) return false;
    }

    return true;
  });

  // --- SORTING ---
  const sortedCases = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredCases;

    return [...filteredCases].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortConfig.key) {
        case "id":
          aVal = a.id; bVal = b.id; break;
        case "doctor":
          aVal = a.doctorUser?.name || a.doctorName || ""; bVal = b.doctorUser?.name || b.doctorName || ""; break;
        case "zip":
          aVal = a.doctorUser?.address?.zipCode || ""; bVal = b.doctorUser?.address?.zipCode || ""; break;
        case "product":
          aVal = a.product; bVal = b.product; break;
        case "status":
          aVal = a.status; bVal = b.status; break;
        case "approved":
          aVal = new Date(a.updatedAt).getTime(); bVal = new Date(b.updatedAt).getTime(); break;
        case "due":
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCases, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  // --- SELECTION & HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleStatusFilter = (status: string) => {
    const next = new Set(statusFilter);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setStatusFilter(next);
  };

  const hasSelection = selectedIds.size > 0;
  const canShip = useMemo(() => {
    if (!hasSelection) return false;
    const selectedCases = cases.filter(c => selectedIds.has(c.id));
    return selectedCases.every(c => c.status === "IN_MILLING");
  }, [selectedIds, cases, hasSelection]);
  const canDownload = hasSelection;

  const handleDownload = async () => {
    if (!canDownload) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/cases/batch/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `production_batch_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.location.reload();
    } catch {
      alert("Failed to generate batch.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShipConfirm = async (carrier: string, tracking: string) => {
    setIsSavingShipment(true);
    try {
      const res = await fetch("/api/cases/batch/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), carrier, tracking })
      });
      if (!res.ok) throw new Error("Failed");
      setIsShipping(false);
      setSelectedIds(new Set());
      window.location.reload();
    } catch {
      alert("Shipping update failed.");
    } finally {
      setIsSavingShipment(false);
    }
  };

  return (
    <section className="flex flex-col h-full w-full p-6 overflow-hidden relative">
      <div className="flex-none space-y-4 mb-4">
        <MillingHeader 
          queueCount={sortedCases.length}
          selectedCount={selectedIds.size}
          isDownloading={isDownloading}
          canDownload={canDownload}
          canShip={canShip}
          onDownload={handleDownload}
          onShip={() => setIsShipping(true)}
        />
        <MillingFilters 
          statusFilter={statusFilter}
          toggleStatus={toggleStatusFilter}
          showShipped={showShipped}
          setShowShipped={setShowShipped}
          doctorFilter={doctorFilter}
          setDoctorFilter={setDoctorFilter}
          uniqueDoctors={uniqueDoctors}
          zipFilter={zipFilter}
          setZipFilter={setZipFilter}
          uniqueZips={uniqueZips}
          onClear={() => { setDoctorFilter("ALL"); setZipFilter("ALL"); }}
        />
      </div>

      <MillingTable 
        cases={sortedCases}
        selectedIds={selectedIds}
        sortConfig={sortConfig}
        onSort={handleSort}
        onSelect={toggleSelect}
        onSelectAll={toggleSelectAll}
      />

      <ShippingModal 
        isOpen={isShipping}
        count={selectedIds.size}
        onClose={() => setIsShipping(false)}
        onConfirm={handleShipConfirm}
        isSaving={isSavingShipment}
      />
    </section>
  );
}