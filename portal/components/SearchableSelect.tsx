// portal/components/SearchableSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";

type Option = { id: string; label: string; subLabel?: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  onSearch?: (term: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function SearchableSelect({ label, options, value, onChange, onSearch, placeholder, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    if (nextState) {
        // ✅ FIX: Reset search when opening
        setSearch(""); 
        // ✅ CRITICAL FIX: Tell parent to reset server-side search too
        if (onSearch) onSearch(""); 
    }
  };

  const displayedOptions = onSearch 
    ? options 
    : options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
      );

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {label && <label className="text-sm font-medium text-white/70">{label}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`
          w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-left flex items-center justify-between transition
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/30 focus:border-blue-500/50"}
        `}
      >
        <div className="flex flex-col items-start truncate">
            <span className={selectedOption ? "text-white" : "text-white/40"}>
            {selectedOption ? selectedOption.label : placeholder || "Select..."}
            </span>
            {selectedOption?.subLabel && (
                <span className="text-[10px] text-white/50">{selectedOption.subLabel}</span>
            )}
        </div>
        
        <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl max-h-60 flex flex-col overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-white/10 sticky top-0 bg-[#1a1a1a]">
            <input
              autoFocus
              value={search}
              onChange={handleSearchChange}
              placeholder="Type to search..."
              className="w-full bg-black/20 text-white text-sm rounded px-3 py-2 border border-white/5 focus:border-blue-500/50 outline-none"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {displayedOptions.length === 0 ? (
              <div className="p-3 text-sm text-white/40 text-center">No results found.</div>
            ) : (
              displayedOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 text-sm border-b border-white/5 hover:bg-white/10 transition
                    ${value === opt.id ? "bg-blue-500/10 text-blue-300" : "text-white/80"}
                  `}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.subLabel && <div className="text-xs text-white/40">{opt.subLabel}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}