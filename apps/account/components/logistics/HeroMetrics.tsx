import type { AccountLogisticsSnapshot } from "@/lib/logistics-module";

function formatNaira(amountMinor: number): { major: string; sub: string } {
  const naira = amountMinor / 100;
  if (naira >= 1_000_000) {
    return { major: (naira / 1_000_000).toFixed(naira >= 10_000_000 ? 0 : 1), sub: "m" };
  }
  if (naira >= 1_000) {
    return { major: (naira / 1_000).toFixed(naira >= 10_000 ? 0 : 1), sub: "k" };
  }
  return { major: Math.round(naira).toLocaleString("en-NG"), sub: "" };
}

type Props = {
  metrics: AccountLogisticsSnapshot["metrics"];
};

export function HeroMetrics({ metrics }: Props) {
  const spend = formatNaira(metrics.totalSpendMinor);
  return (
    <div className="acct-log__metrics" role="list" aria-label="Logistics performance">
      <div className="acct-log__metric acct-log__metric--copper" role="listitem">
        <span className="acct-log__metric-label">Active now</span>
        <span className="acct-log__metric-value">{metrics.activeCount}</span>
        <span className="acct-log__metric-foot">
          {metrics.activeCount === 1 ? "shipment in flight" : "shipments in flight"}
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">Delivered · this month</span>
        <span className="acct-log__metric-value">{metrics.deliveredThisMonth}</span>
        <span className="acct-log__metric-foot">
          {metrics.lifetimeShipments} lifetime
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">On-time rate</span>
        <span className="acct-log__metric-value">
          {metrics.onTimeRatePct == null ? "—" : `${metrics.onTimeRatePct}%`}
        </span>
        <span className="acct-log__metric-foot">
          {metrics.onTimeRatePct == null ? "Awaiting first scheduled delivery" : "Of scheduled deliveries"}
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">Total spend</span>
        <span className="acct-log__metric-value">
          <span className="acct-log__metric-value-currency" aria-hidden>
            ₦
          </span>
          {spend.major}
          {spend.sub}
        </span>
        <span className="acct-log__metric-foot">Paid lifetime</span>
      </div>
    </div>
  );
}
