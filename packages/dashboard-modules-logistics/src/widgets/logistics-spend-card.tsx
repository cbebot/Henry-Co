import { MetricCard } from "@henryco/dashboard-shell/components";
import { Wallet } from "lucide-react";

import { formatMoney } from "../format";
import { LOGISTICS_HOME_HREF, type LogisticsSnapshot } from "../data";

const TOTAL_SPEND_LABEL = "Total spend";

/**
 * LogisticsSpendCard — lifetime logistics spend
 * (`metrics.totalSpendMinor`, minor units) with the real lifetime
 * shipment count as its grounding context. Deep-links to `/logistics`.
 */
export function LogisticsSpendCard({ snapshot }: { snapshot: LogisticsSnapshot }) {
  const { totalSpendMinor, lifetimeShipments } = snapshot.metrics;

  return (
    <MetricCard
      label={TOTAL_SPEND_LABEL}
      value={formatMoney(totalSpendMinor, snapshot.currency)}
      icon={<Wallet size={18} aria-hidden />}
      href={LOGISTICS_HOME_HREF}
      context={{
        kind: "comparison",
        vs: "all shipments",
        delta: `${lifetimeShipments} shipment${lifetimeShipments === 1 ? "" : "s"}`,
      }}
    />
  );
}
