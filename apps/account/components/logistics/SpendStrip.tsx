import type { AccountCopy } from "@henryco/i18n";

import type { AccountLogisticsSnapshot } from "@/lib/logistics-module";

type Props = {
  spendByMonth: AccountLogisticsSnapshot["spendByMonth"];
  copy: AccountCopy["divisionLogistics"];
};

function formatTickAmount(amountMinor: number, emptyTick: string): string {
  const naira = amountMinor / 100;
  if (naira === 0) return emptyTick;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(naira >= 10_000_000 ? 0 : 1)}m`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(naira >= 10_000 ? 0 : 1)}k`;
  return `₦${Math.round(naira).toLocaleString("en-NG")}`;
}

export function SpendStrip({ spendByMonth, copy }: Props) {
  if (spendByMonth.length === 0) return null;
  const max = spendByMonth.reduce((acc, m) => Math.max(acc, m.totalMinor), 0);
  return (
    <div className="acct-log__spend" role="figure" aria-label={copy.spend.figureAriaLabel}>
      {spendByMonth.map((m) => {
        const ratio = max > 0 ? m.totalMinor / max : 0;
        const height = Math.max(6, Math.round(ratio * 88));
        return (
          <div className="acct-log__spend-col" key={m.monthIso}>
            <span className="acct-log__spend-amount">
              {formatTickAmount(m.totalMinor, copy.spend.emptyTick)}
            </span>
            <span
              className="acct-log__spend-bar"
              data-empty={max === 0 || m.totalMinor === 0 ? "true" : undefined}
              style={{ height }}
            />
            <span className="acct-log__spend-label">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}
