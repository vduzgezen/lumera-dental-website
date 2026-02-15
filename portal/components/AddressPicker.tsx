// portal/components/AddressPicker.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import SearchableSelect from "@/components/SearchableSelect";

export type AddressData = {
  id?: string | null;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type Props = {
  value: AddressData;
  onChange: (val: AddressData) => void;
};

export default function AddressPicker({ value, onChange }: Props) {
  const [existing, setExisting] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  
  // Debounce logic for search
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch addresses (filtered by term if present)
  const fetchAddresses = useCallback(async (term: string) => {
    try {
      const qs = term ? `?q=${encodeURIComponent(term)}` : "";
      const res = await fetch(`/api/addresses${qs}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setExisting(data);
      }
    } catch (e) {
      console.error("Failed to load addresses", e);
    }
  }, []);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
        // ✅ FIX: Removed "if (searchTerm)" check. 
        // Now it fetches ALL addresses if searchTerm is empty (resetting the list).
        fetchAddresses(searchTerm); 
    }, 400); // 400ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchAddresses]);

  // Sync internal ID if value changes externally
  useEffect(() => {
    if (value.id) setSelectedId(value.id);
  }, [value.id]);

  const options = useMemo(() => {
    const list = existing.map((addr) => ({
      id: addr.id,
      label: `${addr.street || "Unknown"}, ${addr.city || "Unknown"}`,
      subLabel: `${addr.state || ""} ${addr.zipCode || ""}`
    }));

    // Inject current value if missing from list (preserves display when paging/filtering)
    if (value.id && !list.find(o => o.id === value.id)) {
        list.unshift({
            id: value.id,
            label: `${value.street || "Unknown"}, ${value.city || "Unknown"}`,
            subLabel: `${value.state || ""} ${value.zipCode || ""} (Current)`
        });
    }

    return list;
  }, [existing, value]);

  function handleSelectExisting(id: string) {
    const match = existing.find((a) => a.id === id) 
               || (id === value.id ? { ...value } : null);

    if (match) {
      setSelectedId(id);
      onChange({
        id: match.id,
        street: match.street || "",
        city: match.city || "",
        state: match.state || "",
        zipCode: match.zipCode || ""
      });
    }
  }

  function handleChangeField(field: keyof AddressData, val: string) {
    // Clear ID to imply new/unlinked address
    onChange({ ...value, id: null, [field]: val });
    setSelectedId(""); 
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Address</h4>
        <span className="text-[10px] text-muted">Search or enter new</span>
      </div>

      {/* Search Bar with Live Search */}
      <SearchableSelect
        label=""
        placeholder="🔍 Search existing addresses..."
        options={options}
        value={selectedId}
        onChange={handleSelectExisting}
        onSearch={setSearchTerm} // Hook up live search
      />

      {/* Manual Fields */}
      <div>
        <input 
          placeholder="Street Address" 
          className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:border-accent/50 outline-none mb-2 placeholder:text-muted transition-colors duration-200"
          value={value.street}
          onChange={(e) => handleChangeField("street", e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input 
            placeholder="City" 
            className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-accent/50 outline-none placeholder:text-muted transition-colors duration-200"
            value={value.city}
            onChange={(e) => handleChangeField("city", e.target.value)}
          />
          <input 
            placeholder="State" 
            className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-accent/50 outline-none placeholder:text-muted transition-colors duration-200"
            value={value.state}
            onChange={(e) => handleChangeField("state", e.target.value)}
          />
          <input 
            placeholder="Zip" 
            className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-accent/50 outline-none placeholder:text-muted transition-colors duration-200"
            value={value.zipCode}
            onChange={(e) => handleChangeField("zipCode", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}