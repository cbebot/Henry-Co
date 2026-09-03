import { type BalancePoint, formatKoboCompact } from "./helpers";

/**
 * BalanceTrend — the running-balance line of the Onyx Ledger.
 *
 * Charts the authoritative `balance_after_kobo` the ledger records per
 * transaction (oldest→newest). Pure inline SVG — no charting dependency,
 * no client JS. Money is never computed here; we only plot recorded balances.
 *
 * Degrades honestly: with fewer than two points it shows a calm "not enough
 * history yet" state rather than a misleading flat line.
 */
export type BalanceTrendCopy = {
  title: string;
  subtitle: string;
  emptyLabel: string;
  currentLabel: string;
  ariaLabel: string;
};

type BalanceTrendProps = {
  series: ReadonlyArray<BalancePoint>;
  copy: BalanceTrendCopy;
};

const W = 100;
const H = 38;
const PAD_Y = 4;

export function BalanceTrend({ series, copy }: BalanceTrendProps) {
  const points = series.filter((p) => Number.isFinite(p.balanceKobo));
  const enough = points.length >= 2;

  let linePath = "";
  let areaPath = "";
  let lastX = W;
  let lastY = H / 2;
  let minKobo = 0;
  let maxKobo = 0;

  if (enough) {
    const values = points.map((p) => p.balanceKobo);
    minKobo = Math.min(...values);
    maxKobo = Math.max(...values);
    const span = maxKobo - minKobo || 1;
    const n = points.length;

    const coords = points.map((p, i) => {
      const x = (i / (n - 1)) * W;
      const norm = (p.balanceKobo - minKobo) / span;
      const y = H - PAD_Y - norm * (H - PAD_Y * 2);
      return { x, y };
    });

    linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
      .join(" ");
    areaPath = `${linePath} L${W},${H} L0,${H} Z`;
    lastX = coords[coords.length - 1].x;
    lastY = coords[coords.length - 1].y;
  }

  return (
    <section className="acct-wal__trend" aria-label={copy.ariaLabel}>
      <div className="acct-wal__trend-head">
        <div>
          <p className="acct-wal__panel-title">{copy.title}</p>
          <p className="acct-wal__panel-sub">{copy.subtitle}</p>
        </div>
        {enough ? (
          <span className="acct-wal__trend-now">
            <span className="acct-wal__trend-now-label">{copy.currentLabel}</span>
            <span className="acct-wal__trend-now-value">
              ₦{formatKoboCompact(points[points.length - 1].balanceKobo)}
            </span>
          </span>
        ) : null}
      </div>

      {enough ? (
        <div className="acct-wal__trend-canvas">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="acct-wal__trend-svg"
            role="img"
            aria-label={copy.ariaLabel}
          >
            <defs>
              <linearGradient id="walTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="acct-wal__trend-fill-top" />
                <stop offset="100%" className="acct-wal__trend-fill-bot" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#walTrendFill)" stroke="none" />
            <path
              d={linePath}
              fill="none"
              className="acct-wal__trend-line"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={lastX} cy={lastY} r="1.6" className="acct-wal__trend-dot" />
          </svg>
          <div className="acct-wal__trend-axis" aria-hidden="true">
            <span>₦{formatKoboCompact(minKobo)}</span>
            <span>₦{formatKoboCompact(maxKobo)}</span>
          </div>
        </div>
      ) : (
        <p className="acct-wal__trend-empty">{copy.emptyLabel}</p>
      )}
    </section>
  );
}

export default BalanceTrend;
