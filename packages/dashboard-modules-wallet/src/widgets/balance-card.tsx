import { Panel, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { typeStyle } from "@henryco/dashboard-shell/tokens";
import { Wallet, Plus, ArrowUpRight } from "lucide-react";
import { formatNaira } from "../format";
import type { WalletSnapshot, WalletTransactionRow } from "../data";

/**
 * Minimal SVG sparkline for the wallet balance card.
 *
 * Reconstructs a per-transaction running balance from the recent
 * transactions (newest first → walked oldest first) and renders a
 * 80x24 polyline. The starting point is the *current* available
 * balance minus the net delta of the visible window, so the line
 * always lands at the headline figure on the right edge. Empty state
 * (zero transactions) renders nothing — caller falls back to the
 * help text.
 */
function BalanceSparkline({
  transactions,
  currentKobo,
}: {
  transactions: ReadonlyArray<WalletTransactionRow>;
  currentKobo: number;
}) {
  if (transactions.length === 0) return null;
  // Walk oldest → newest, accumulating signed delta.
  const ordered = [...transactions].reverse();
  const deltas = ordered.map((t) =>
    t.direction === "credit" ? t.amountKobo : -t.amountKobo,
  );
  const netDelta = deltas.reduce((acc, d) => acc + d, 0);
  // Reconstructed running balance, newest stamp lands at currentKobo.
  let running = currentKobo - netDelta;
  const points = [running];
  for (const d of deltas) {
    running += d;
    points.push(running);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  const w = 80;
  const h = 24;
  const stepX = points.length > 1 ? w / (points.length - 1) : w;
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const lastDirection = points[points.length - 1] >= points[0] ? "up" : "down";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Recent activity trend: ${lastDirection}`}
      style={{
        display: "inline-block",
        marginLeft: "0.5rem",
        verticalAlign: "middle",
        opacity: 0.85,
      }}
    >
      <defs>
        <linearGradient id="hc-wallet-spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.0" />
          <stop offset="35%" stopColor="currentColor" stopOpacity="0.65" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#hc-wallet-spark)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--acct-gold, #C9A227)" }}
      />
    </svg>
  );
}

/**
 * BalanceCard — the wallet module's headline widget. Renders the
 * available balance (raw balance minus pending withdrawal hold) with
 * inline "Add money" + "Withdraw" CTAs. Unlike DASH-2's customer-
 * overview `WalletBalanceCard` (a summary metric that links to
 * `/wallet`), this widget is the wallet module's primary surface and
 * embeds the two most-used wallet actions directly.
 */
export function BalanceCard({ snapshot }: { snapshot: WalletSnapshot }) {
  const hasHold = snapshot.pendingWithdrawalKobo > 0;

  return (
    <Panel tone="raised">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.25rem",
        }}
      >
        <p
          style={{
            ...typeStyle("kicker"),
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          Wallet balance
        </p>
        <span
          aria-hidden
          style={{ color: `var(${CSS_VARS.accentText})`, display: "inline-flex" }}
        >
          <Wallet size={18} />
        </span>
      </header>
      <p
        // V5-4 editorial: Iowan Old Style at hero scale, with old-style
        // figures and tabular alignment so "₦12,400" reads like a
        // private-bank statement instead of a fintech app.
        className="hc-metric-value"
        style={{
          fontFamily:
            'var(--acct-font-display, "Iowan Old Style", "Baskerville", "Palatino Linotype", "Times New Roman", serif)',
          fontWeight: 500,
          fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          fontFeatureSettings: '"lnum" 0, "onum" 1, "kern" 1, "ss01" 1',
          fontVariantNumeric: "oldstyle-nums tabular-nums",
          color: `var(${CSS_VARS.ink})`,
          margin: "0.5rem 0 0",
        }}
      >
        {formatNaira(snapshot.availableBalanceKobo)}
        <BalanceSparkline
          transactions={snapshot.recentTransactions}
          currentKobo={snapshot.availableBalanceKobo}
        />
      </p>
      <p
        style={{
          ...typeStyle("small"),
          color: `var(${CSS_VARS.inkSoft})`,
          margin: "0.25rem 0 1rem",
        }}
      >
        {hasHold
          ? `${formatNaira(snapshot.pendingWithdrawalKobo)} held in pending withdrawal · ${snapshot.currency}`
          : `Available across Henry Onyx · ${snapshot.currency}`}
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <ActionButton
          href="/wallet/funding"
          tone="primary"
          icon={<Plus size={16} aria-hidden />}
        >
          Add money
        </ActionButton>
        <ActionButton
          href="/wallet/withdrawals"
          tone="secondary"
          icon={<ArrowUpRight size={16} aria-hidden />}
        >
          Withdraw
        </ActionButton>
      </div>
    </Panel>
  );
}
