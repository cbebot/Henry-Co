import { TrendingDown, TrendingUp } from "lucide-react";
import type { AccountCopy } from "@henryco/i18n/server";
import {
  divisionBreakdown,
  formatKoboCompact,
  formatKoboMajor,
  spendByMonth,
  windowedSpend,
  type WalletTransaction,
} from "./helpers";

type Props = {
  transactions: ReadonlyArray<WalletTransaction>;
  copy: AccountCopy["wallet"]["spend"];
};

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function SpendStrip({ transactions, copy }: Props) {
  const monthly = spendByMonth(transactions, 6);
  const slices = divisionBreakdown(transactions);
  const window = windowedSpend(transactions);
  const max = monthly.reduce((m, x) => Math.max(m, x.totalKobo), 0);
  const trend = window.trend;
  const deltaPct = window.deltaPct;

  const trendLabel =
    trend === "flat"
      ? copy.trendFlat
      : format(trend === "down" ? copy.trendBelowTemplate : copy.trendAboveTemplate, {
          pct: Math.abs(deltaPct),
        });

  return (
    <div className="acct-wal__spend" role="figure" aria-label={copy.figureAriaLabel}>
      <div className="acct-wal__spend-head">
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--acct-muted)",
              margin: 0,
            }}
          >
            {copy.last30Eyebrow}
          </p>
          <p className="acct-wal__spend-total" style={{ marginTop: 8 }}>
            ₦{formatKoboMajor(window.last30Kobo)}
          </p>
        </div>
        {window.last30Kobo > 0 || window.prior30Kobo > 0 ? (
          <span
            className="acct-wal__chip"
            data-tone={trend === "down" ? "success" : trend === "up" ? "warn" : "neutral"}
            title={format(copy.trendTitleTemplate, {
              amount: formatKoboCompact(window.prior30Kobo),
            })}
          >
            {trend === "down" ? (
              <TrendingDown size={11} aria-hidden />
            ) : trend === "up" ? (
              <TrendingUp size={11} aria-hidden />
            ) : null}
            {trendLabel}
          </span>
        ) : null}
      </div>
      <div className="acct-wal__spend-curve" aria-hidden>
        {monthly.map((m) => {
          const ratio = max > 0 ? m.totalKobo / max : 0;
          const height = Math.max(6, Math.round(ratio * 84));
          return (
            <div className="acct-wal__spend-bar-col" key={m.monthIso}>
              <span className="acct-wal__spend-bar-amt">
                {m.totalKobo > 0 ? `₦${formatKoboCompact(m.totalKobo)}` : "—"}
              </span>
              <span
                className="acct-wal__spend-bar"
                data-empty={m.totalKobo === 0 ? "true" : undefined}
                style={{ height }}
              />
              <span className="acct-wal__spend-bar-label">{m.label}</span>
            </div>
          );
        })}
      </div>
      {slices.length > 0 ? (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--acct-muted)",
              margin: "0 0 8px",
            }}
          >
            {copy.byDivisionEyebrow}
          </p>
          <div
            className="acct-wal__division-bar"
            role="img"
            aria-label={copy.distributionAriaLabel}
          >
            {slices.map((s) => (
              <span
                key={s.key}
                className="acct-wal__division-bar-seg"
                style={{ width: `${s.pct}%`, background: s.color }}
                title={`${s.label} · ${Math.round(s.pct)}%`}
              />
            ))}
          </div>
          <div className="acct-wal__division-legend" style={{ marginTop: 10 }}>
            {slices.map((s) => (
              <span className="acct-wal__division-legend-item" key={s.key}>
                <span
                  className="acct-wal__division-legend-dot"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {s.label} · ₦{formatKoboCompact(s.totalKobo)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
