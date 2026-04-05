import { buildTrackingTimeline } from "@/lib/logistics/data";
import type { LogisticsEvent, LogisticsShipment } from "@/lib/logistics/types";

export default function LogisticsTimeline({
  shipment,
  events,
}: {
  shipment: LogisticsShipment;
  events: LogisticsEvent[];
}) {
  const steps = buildTrackingTimeline(shipment, events.filter((e) => e.customerVisible));

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
          {index < steps.length - 1 ? (
            <div
              className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-px bg-[var(--logistics-line)]"
              aria-hidden
            />
          ) : null}
          <div className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--logistics-line-strong)] bg-[#09060a]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${step.active ? "bg-[var(--logistics-accent)]" : "bg-white/25"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={`font-semibold ${step.active ? "text-white" : "text-white/70"}`}>{step.label}</span>
              {step.when ? (
                <time className="text-xs text-[var(--logistics-muted)]" dateTime={step.when}>
                  {new Date(step.when).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
