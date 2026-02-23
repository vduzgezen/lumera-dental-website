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
        <h1 className="text-2xl font-semibold text-foreground">Milling Dashboard</h1>
        <span className="text-sm text-muted">Queue: {queueCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          disabled={!canDownload || isDownloading}
          className={`
            px-4 py-2 font-bold rounded-lg transition-all flex items-center gap-2 border-2 shadow-sm
            ${(!canDownload || isDownloading) 
              ? "opacity-40 cursor-not-allowed border-border bg-surface text-muted" 
              // ✅ FIX: Matches the exact styling of Ship Batch (foreground bg, background text)
              : "cursor-pointer border-foreground bg-foreground text-background hover:opacity-80 hover:shadow-md"
            }
          `}
        >
          {isDownloading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Zipping...
            </>
          ) : `Download Batch (${selectedCount})`}
        </button>

        <button
          onClick={onShip}
          disabled={!canShip}
          className={`
            px-4 py-2 font-bold rounded-lg transition-all flex items-center gap-2 border-2 shadow-sm
            ${!canShip 
              ? "opacity-40 cursor-not-allowed border-border bg-surface text-muted" 
              : "cursor-pointer border-foreground bg-foreground text-background hover:opacity-80 hover:shadow-md"
            }
          `}
        >
          Ship Batch
        </button>
      </div>
    </header>
  );
}