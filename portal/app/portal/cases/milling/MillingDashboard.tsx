// FILE: app/portal/cases/milling/MillingDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { CaseRow } from "../page";
import MillingHeader from "./MillingHeader";
import MillingFilters from "./MillingFilters";
import MillingTable from "./MillingTable";
import ShippingModal from "./ShippingModal";
import { calculateProductionCosts } from "@/lib/cost-engine";

// ✅ 1. Local Interface Definition
interface LocalShippingTarget {
  name: string;
  attn: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

interface MillingDashboardProps {
  cases: CaseRow[];
}

export default function MillingDashboard({ cases }: MillingDashboardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(["APPROVED", "IN_MILLING"]));
  const [showShipped, setShowShipped] = useState(false);
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [zipFilter, setZipFilter] = useState("ALL");

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

  const sortedCases = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredCases;
    return [...filteredCases].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";
      switch (sortConfig.key) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "alias": aVal = a.patientAlias; bVal = b.patientAlias; break;
        case "doctor": aVal = a.doctorUser?.name || a.doctorName || ""; bVal = b.doctorUser?.name || b.doctorName || ""; break;
        case "zip": aVal = a.doctorUser?.address?.zipCode || ""; bVal = b.doctorUser?.address?.zipCode || ""; break;
        case "product": aVal = a.product; bVal = b.product; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "approved": aVal = new Date(a.updatedAt).getTime(); bVal = new Date(b.updatedAt).getTime(); break;
        case "due": aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0; bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0; break;
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

  // --- LOGIC: BATCH METRICS ---
  const batchMetrics = useMemo(() => {
    let totalCost = 0;
    const clinics = new Set<string>();
    const doctors = new Set<string>();
    
    // ✅ Type explicitly set to LocalShippingTarget OR null
    let shipTarget: LocalShippingTarget | null = null;

    // ✅ CRITICAL FIX: Changed from .forEach() to for...of loop.
    // This allows TypeScript to correctly infer that 'shipTarget' is assigned a value.
    for (const c of cases) {
        if (selectedIds.has(c.id)) {
            // 1. Calculate Cost
            const costs = calculateProductionCosts(c.product, c.material, 1, false); 
            totalCost += costs.milling;

            // 2. Track Entities
            if (c.clinic?.name) clinics.add(c.clinic.name);
            const docName = c.doctorUser?.name || c.doctorName || "Unknown";
            doctors.add(docName);

            // 3. Capture Address (Take the first one found)
            if (!shipTarget && c.doctorUser?.address) {
                const phone = c.clinic.phone || c.doctorUser.phoneNumber || "No Phone";
                
                shipTarget = {
                    name: docName,
                    attn: null,
                    phone: phone,
                    street: c.doctorUser.address.street, 
                    city: c.doctorUser.address.city,
                    state: c.doctorUser.address.state,
                    zip: c.doctorUser.address.zipCode
                };
            }
        }
    }

    // 4. Handle Multi-Doctor Batches
    // TS now understands shipTarget is not "never" here because the assignment happened in the same scope.
    if (shipTarget && doctors.size > 1) {
        const clinicName = Array.from(clinics)[0] || "Dental Clinic";
        const docList = Array.from(doctors).join(", ");
        
        shipTarget.name = clinicName;
        shipTarget.attn = `Attn: ${docList}`;
    }

    return {
        value: totalCost,
        isMixed: clinics.size > 1,
        uniqueClinics: Array.from(clinics),
        destination: shipTarget
    };
  }, [selectedIds, cases]);

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

  const handleShipConfirm = async (carrier: string, tracking: string, shippingCost?: number) => {
    setIsSavingShipment(true);
    try {
      const res = await fetch("/api/cases/batch/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), carrier, tracking, shippingCost })
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
        batchValue={batchMetrics.value}
        isMixedBatch={batchMetrics.isMixed}
        uniqueClinics={batchMetrics.uniqueClinics}
        destination={batchMetrics.destination}
        onClose={() => setIsShipping(false)}
        onConfirm={handleShipConfirm}
        isSaving={isSavingShipment}
      />
    </section>
  );
}