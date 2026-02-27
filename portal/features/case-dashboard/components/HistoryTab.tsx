// features/case-dashboard/components/HistoryTab.tsx
import { memo } from "react";

type HistoryEvent = {
  id: string;
  to: string;
  at: Date | string;
  note?: string | null;
  actor?: { name: string | null; email: string } | null; // Placeholder for future actor expansion
};

type Props = {
  isActive: boolean;
  events: HistoryEvent[];
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const HistoryTabComponent = ({ isActive, events }: Props) => {
  if (!isActive) return null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200 block">
      {events.length === 0 ? (
        <p className="text-muted text-sm text-center mt-4">No events yet.</p>
      ) : (
        <div className="relative border-l-2 border-border/60 ml-3 space-y-6 pt-2 pb-4">
          {events.map((ev) => {
            // Explicitly format every single status
            let displayStatus = ev.to.replace(/_/g, " ");
            let colorClass = "bg-accent";

            switch (ev.to) {
              case "READY_FOR_REVIEW":
                displayStatus = "Ready For Review";
                colorClass = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]";
                break;
              case "IN_DESIGN":
              case "DESIGN":
                displayStatus = "In Design";
                colorClass = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]";
                break;
              case "CHANGES_REQUESTED":
              case "CHANGES_REQUESTED_FROM_DOCTOR":
                displayStatus = "Changes Requested";
                colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                break;
              case "APPROVED":
                displayStatus = "Approved";
                colorClass = "bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.4)]";
                break;
              case "IN_MILLING":
                displayStatus = "In Milling";
                colorClass = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]";
                break;
              case "SHIPPED":
                displayStatus = "Shipped";
                colorClass = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]";
                break;
              case "COMPLETED":
                displayStatus = "Arrived at Clinic";
                colorClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                break;
              case "DELIVERED":
                displayStatus = "Delivered to Patient";
                colorClass = "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]";
                break;
              case "CANCELLED":
                displayStatus = "Cancelled";
                colorClass = "bg-gray-500";
                break;
            }

            return (
              <div key={ev.id} className="ml-5 relative">
                {/* The Color-Coded Glow Dot */}
                <div
                  className={`absolute -left-[27.5px] top-1.5 w-3 h-3 rounded-full ${colorClass} border-2 border-surface transition-colors duration-200 z-10`}
                />

                <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/50 shadow-sm transition-all hover:border-border hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground tracking-tight">
                      {displayStatus}
                    </span>
                    <span className="text-[10px] text-muted font-mono whitespace-nowrap mt-0.5">
                      {fmtDate(ev.at)}
                    </span>
                  </div>
                  {ev.note && (
                    <div className="mt-2 text-[11px] text-foreground/80 bg-background/50 p-2 rounded-lg border border-border/50 italic leading-relaxed">
                      &quot;{ev.note}&quot;
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(HistoryTabComponent);