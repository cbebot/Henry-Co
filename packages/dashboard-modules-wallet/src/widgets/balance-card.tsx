import { Panel, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { typeStyle } from "@henryco/dashboard-shell/tokens";
import { Wallet, Plus, ArrowUpRight } from "lucide-react";
import { formatNaira } from "../format";
import type { WalletSnapshot } from "../data";

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
        style={{
          ...typeStyle("title"),
          color: `var(${CSS_VARS.ink})`,
          margin: "0.5rem 0 0",
        }}
      >
        {formatNaira(snapshot.availableBalanceKobo)}
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
          : `Available across HenryCo · ${snapshot.currency}`}
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
