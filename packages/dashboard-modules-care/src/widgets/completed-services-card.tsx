import { MetricCard } from "@henryco/dashboard-shell/components";
import { CheckCircle2 } from "lucide-react";

import { CARE_HOME_HREF, type CareSnapshot } from "../data";

/**
 * CompletedServicesCard — the count of finished care jobs, with the
 * live in-flight count as its trend context (so the metric is never a
 * number without meaning). Both figures come straight from `careStats`.
 * Deep-links to `/care`.
 */
export function CompletedServicesCard({ snapshot }: { snapshot: CareSnapshot }) {
  const { completed, inFlight } = snapshot.stats;

  return (
    <MetricCard
      label="Completed"
      value={String(completed)}
      icon={<CheckCircle2 size={18} aria-hidden />}
      href={CARE_HOME_HREF}
      context={{
        kind: "trend",
        direction: inFlight > 0 ? "up" : "flat",
        magnitude:
          inFlight > 0
            ? `${inFlight} in flight now`
            : completed > 0
              ? "All caught up"
              : "No jobs yet",
      }}
    />
  );
}
