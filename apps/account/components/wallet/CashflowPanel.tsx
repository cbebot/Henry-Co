import { type Cashflow, formatKoboMajor } from "./helpers";

/**
 * CashflowPanel — money IN and money OUT over the recent window.
 *
 * The legacy spend strip only counted debits; a real wallet shows both
 * directions. Inflows (top-ups, refunds, bonus, cashback) and outflows are
 * read straight from recorded transactions — no balance math here.
 */
export type CashflowCopy = {
  title: string;
  periodLabel: string;
  moneyInLabel: string;
  moneyOutLabel: string;
  netLabel: string;
  emptyLabel: string;
  ariaLabel: string;
};

type CashflowPanelProps = {
  cashflow: Cashflow;
  copy: CashflowCopy;
};

export function CashflowPanel({ cashflow, copy }: CashflowPanelProps) {
  const { inKobo, outKobo, netKobo } = cashflow;
  const total = inKobo + outKobo;
  const inPct = total > 0 ? Math.round((inKobo / total) * 100) : 0;
  const outPct = total > 0 ? 100 - inPct : 0;
  const hasFlow = total > 0;
  const netPositive = netKobo >= 0;

  return (
    <section className="acct-wal__cashflow" aria-label={copy.ariaLabel}>
      <div className="acct-wal__cashflow-head">
        <p className="acct-wal__panel-title">{copy.title}</p>
        <span className="acct-wal__panel-sub">{copy.periodLabel}</span>
      </div>

      {hasFlow ? (
        <>
          <div className="acct-wal__cashflow-figures">
            <div className="acct-wal__cashflow-fig" data-dir="in">
              <span className="acct-wal__cashflow-fig-label">
                <span className="acct-wal__cashflow-arrow" aria-hidden="true">
                  ↓
                </span>
                {copy.moneyInLabel}
              </span>
              <span className="acct-wal__cashflow-fig-value">₦{formatKoboMajor(inKobo)}</span>
            </div>
            <div className="acct-wal__cashflow-fig" data-dir="out">
              <span className="acct-wal__cashflow-fig-label">
                <span className="acct-wal__cashflow-arrow" aria-hidden="true">
                  ↑
                </span>
                {copy.moneyOutLabel}
              </span>
              <span className="acct-wal__cashflow-fig-value">₦{formatKoboMajor(outKobo)}</span>
            </div>
          </div>

          <div
            className="acct-wal__cashflow-bar"
            role="img"
            aria-label={`${copy.moneyInLabel} ${inPct}% · ${copy.moneyOutLabel} ${outPct}%`}
          >
            <span
              className="acct-wal__cashflow-seg"
              data-dir="in"
              style={{ width: `${inPct}%` }}
            />
            <span
              className="acct-wal__cashflow-seg"
              data-dir="out"
              style={{ width: `${outPct}%` }}
            />
          </div>

          <div className="acct-wal__cashflow-net" data-positive={netPositive ? "true" : "false"}>
            <span>{copy.netLabel}</span>
            <span className="acct-wal__cashflow-net-value">
              {netPositive ? "+" : "−"}₦{formatKoboMajor(Math.abs(netKobo))}
            </span>
          </div>
        </>
      ) : (
        <p className="acct-wal__cashflow-empty">{copy.emptyLabel}</p>
      )}
    </section>
  );
}

export default CashflowPanel;
