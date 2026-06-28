import { MetricCard } from "@henryco/dashboard-shell/components";
import { Gauge } from "lucide-react";

import { LOGISTICS_HOME_HREF, type LogisticsSnapshot } from "../data";

/**
 * OnTimeRateCard — the real on-time delivery rate
 * (`metrics.onTimeRatePct`), measured as completed shipments delivered
 * within 30 minutes of their promised window. The rate is null until at
 * least one completed shipment carried a promised-delivery timestamp; we
 * show "—" honestly rather than a fabricated figure.
 *
 * The MetricCard contract requires context — we attach the count of
 * deliveries logged this month so the percentage is never a number
 * without grounding.
 */
export function OnTimeRateCard({ snapshot }: { snapshot: LogisticsSnapshot }) {
  const { onTimeRatePct, deliveredThisMonth } = snapshot.metrics;
  const hasRate = onTimeRatePct != null;

  return (
    <MetricCard
      label="On-time rate"
      value={hasRate ? `${onTimeRatePct}%` : "—"}
      icon={<Gauge size={18} aria-hidden />}
      href={LOGISTICS_HOME_HREF}
      context={
        hasRate
          ? {
              kind: "trend",
              direction:
                onTimeRatePct >= 90
                  ? "up"
                  : onTimeRatePct >= 70
                    ? "flat"
                    : "down",
              magnitude: `${deliveredThisMonth} delivered this month`,
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "Not enough deliveries yet",
            }
      }
    />
  );
}
