// portal/app/portal/cases/milling/MillingDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation"; 
import { CaseRow } from "../page";
import MillingHeader from "./MillingHeader";
import MillingFilters from "./MillingFilters";
import MillingTable from "./MillingTable";
import ShippingModal from "./ShippingModal";
import { calculateProductionCosts } from "@/lib/cost-engine";
import { ShippingTarget } from "@/lib/types";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

interface MillingDashboardProps {
  cases: CaseRow[];
  totalCount: number;
  uniqueDoctors: string[];
  uniqueZips: string[];
}

export default function MillingDashboard({ cases, totalCount, uniqueDoctors, uniqueZips }: MillingDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [isSavingShipment, setIsSavingShipment] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- PAGINATION HANDLER ---
  const handleLoadMore = () => {
    setLoadingMore(true);
    const params = new URLSearchParams(searchParams.toString());
    const currentLimit = parseInt(params.get("limit") || "50");
    const newLimit = currentLimit + 50;
    params.set("limit", newLimit.toString());
    
    router.replace(`?${params.toString()}`, { scroll: false });
    setTimeout(() => setLoadingMore(false), 2000);
  };

  // --- SORTING LOGIC ---
  const sortedCases = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return cases;
    return [...cases].sort((a, b) => {
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
  }, [cases, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cases.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const hasSelection = selectedIds.size > 0;
  const canShip = useMemo(() => {
    if (!hasSelection) return false;
    const selectedCases = cases.filter(c => selectedIds.has(c.id));
    return selectedCases.every(c => c.status === "IN_MILLING");
  }, [selectedIds, cases, hasSelection]);
  
  const canDownload = hasSelection;

  const batchMetrics = useMemo(() => {
    let totalCost = 0;
    const clinics = new Set<string>();
    const doctors = new Set<string>();
    let shipTarget: ShippingTarget | null = null;

    for (const c of cases) {
        if (selectedIds.has(c.id)) {
            const costs = calculateProductionCosts(c.product, c.material, 1, false); 
            totalCost += costs.milling;

            if (c.clinic?.name) clinics.add(c.clinic.name);
            const docName = c.doctorUser?.name || c.doctorName || "Unknown";
            doctors.add(docName);

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
          uniqueDoctors={uniqueDoctors}
          uniqueZips={uniqueZips}
        />
      </div>

      <MillingTable 
        cases={sortedCases}
        selectedIds={selectedIds}
        sortConfig={sortConfig}
        onSort={handleSort}
        onSelect={toggleSelect}
        onSelectAll={toggleSelectAll}
        totalCount={totalCount}
        onLoadMore={handleLoadMore}
        loadingMore={loadingMore}
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