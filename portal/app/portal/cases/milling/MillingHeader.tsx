// portal/app/portal/cases/milling/MillingHeader.tsx
"use client";

interface Props {
  queueCount: number;
  selectedCount: number;
  isDownloading: boolean;
  canDownload: boolean;
  canShip: boolean;
  onDownload: () => void;
  onShip: () => void;
}

export default function MillingHeader({
  queueCount,
  selectedCount,
  isDownloading,
  canDownload,
  canShip,
  onDownload,
  onShip
}: Props) {
  return (
    <header className="flex items-center justify-between h-10">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-white">Milling Dashboard</h1>
        <span className="text-sm text-white/40">Queue: {queueCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          disabled={!canDownload || isDownloading}
          className={`
            px-4 py-2 bg-white text-black font-bold rounded-lg transition flex items-center gap-2
            ${(!canDownload || isDownloading) ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"}
          `}
        >
          {isDownloading ? "Zipping..." : `Download Batch (${selectedCount})`}
        </button>

        <button
          onClick={onShip}
          disabled={!canShip}
          className={`
            px-4 py-2 bg-blue-600 text-white font-bold rounded-lg transition flex items-center gap-2
            ${!canShip ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-500 shadow-lg shadow-blue-900/20"}
          `}
        >
          Ship Batch
        </button>
      </div>
    </header>
  );
}