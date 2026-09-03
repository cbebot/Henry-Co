import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

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
  copy: AccountCopy["divisionLogistics"];
};

export function HeroMetrics({ metrics, copy }: Props) {
  const spend = formatNaira(metrics.totalSpendMinor);
  return (
    <div className="acct-log__metrics" role="list" aria-label={copy.metrics.ariaLabel}>
      <div className="acct-log__metric acct-log__metric--copper" role="listitem">
        <span className="acct-log__metric-label">{copy.metrics.activeNowLabel}</span>
        <span className="acct-log__metric-value">{metrics.activeCount}</span>
        <span className="acct-log__metric-foot">
          {metrics.activeCount === 1
            ? copy.metrics.activeFootSingular
            : copy.metrics.activeFootPlural}
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">{copy.metrics.deliveredMonthLabel}</span>
        <span className="acct-log__metric-value">{metrics.deliveredThisMonth}</span>
        <span className="acct-log__metric-foot">
          {formatAccountTemplate(copy.metrics.deliveredMonthFootTemplate, {
            count: metrics.lifetimeShipments,
          })}
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">{copy.metrics.onTimeRateLabel}</span>
        <span className="acct-log__metric-value">
          {metrics.onTimeRatePct == null ? "—" : `${metrics.onTimeRatePct}%`}
        </span>
        <span className="acct-log__metric-foot">
          {metrics.onTimeRatePct == null
            ? copy.metrics.onTimeRateFootEmpty
            : copy.metrics.onTimeRateFootHasValue}
        </span>
      </div>
      <div className="acct-log__metric" role="listitem">
        <span className="acct-log__metric-label">{copy.metrics.totalSpendLabel}</span>
        <span className="acct-log__metric-value">
          <span className="acct-log__metric-value-currency" aria-hidden>
            ₦
          </span>
          {spend.major}
          {spend.sub}
        </span>
        <span className="acct-log__metric-foot">{copy.metrics.totalSpendFoot}</span>
      </div>
    </div>
  );
}
