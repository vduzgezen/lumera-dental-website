// features/case-dashboard/components/HistoryTab.tsx
import { memo } from "react";
import { cn } from "@/lib/utils";
import React from "react";

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
    <div className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar p-2 animate-in fade-in duration-200 block">
      {events.length === 0 ? (
        <p className="text-muted text-sm text-center mt-4">No events yet.</p>
      ) : (
        <div className="grid grid-cols-[16px_1fr] gap-x-4 gap-y-6 pt-2 pb-4 ml-2 pr-4">
          {events.map((ev, index) => {
            const isFirst = index === 0;
            const isLast = index === events.length - 1;

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
              <React.Fragment key={ev.id}>
                {/* Left Column: Timeline Dot & Connecting Line */}
                <div className="relative flex items-center justify-center w-full h-full">
                  {/* The Line Segment (Only draw if multiple events exist) */}
                  {events.length > 1 && (
                    <div
                      className={cn(
                        "absolute w-[2px] bg-gray-400 z-0",
                        isFirst ? "top-1/2 bottom-[-24px]" :
                        isLast ? "top-[-24px] bottom-1/2" :
                        "top-[-24px] bottom-[-24px]"
                      )}
                    />
                  )}

                  {/* The Color-Coded Glow Dot (Locked to static gray border) */}
                  <div
                    className={`relative w-3 h-3 rounded-full ${colorClass} border-2 border-gray-400 z-10`}
                  />
                </div>

                {/* Right Column: The Content Box */}
                <div className="flex flex-col min-w-0 bg-surface p-3 rounded-xl border border-gray-400 shadow-sm transition-all hover:border-gray-500 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground tracking-tight truncate">
                      {displayStatus}
                    </span>
                    <span className="text-[10px] text-muted font-mono whitespace-nowrap mt-0.5 shrink-0">
                      {fmtDate(ev.at)}
                    </span>
                  </div>
                  {ev.note && (
                    <div className="mt-2 text-[11px] text-foreground/80 bg-background/50 p-2 rounded-lg border border-gray-400/60 italic leading-relaxed break-words whitespace-pre-wrap">
                      &quot;{ev.note}&quot;
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(HistoryTabComponent);