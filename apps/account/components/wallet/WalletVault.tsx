import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import type { WalletCurrencyDisplay } from "@/lib/wallet-currency";
import { formatKoboMajor } from "./helpers";

/**
 * WalletVault — the statement header of the Onyx Ledger wallet.
 *
 * A theme-aware ledger instrument (not the generic gold-gradient hero, not a
 * card-on-card stack). The available balance is the single confident figure in
 * NGN — the settlement truth — with the user's currency shown beneath as a
 * clearly-labelled approximation when a live rate exists.
 *
 * MONEY INVARIANT: every figure here is rendered from server-confirmed kobo.
 * Nothing is computed or mutated client-side; the foreign line is display-only.
 *
 * The class is `.acct-wal__vault` (no `__hero` substring) so it owns its palette
 * through account tokens instead of global hero overrides.
 */
export type WalletVaultCopy = {
  eyebrow: string;
  liveLabel: string;
  availableLabel: string;
  balanceAriaTemplate: string;
  syncedLabel: string;
  syncedAria: string;
  onHoldLabel: string;
  totalLabel: string;
  heldLabel: string;
  arrivingTemplate: string;
  approxTemplate: string;
  approxNote: string;
  approxStaleNote: string;
  settlementNgn: string;
  ctaFund: string;
  ctaWithdraw: string;
};

type WalletVaultProps = {
  availableKobo: number;
  balanceKobo: number;
  heldKobo: number;
  arrivingKobo: number;
  currencyTruth: string;
  approxAvailable: WalletCurrencyDisplay | null;
  frozen: boolean;
  copy: WalletVaultCopy;
};

function fill(template: string, key: string, value: string): string {
  return template.replaceAll(`{${key}}`, value);
}

export function WalletVault({
  availableKobo,
  balanceKobo,
  heldKobo,
  arrivingKobo,
  currencyTruth,
  approxAvailable,
  frozen,
  copy,
}: WalletVaultProps) {
  const balanceAria = copy.balanceAriaTemplate
    .replaceAll("{amount}", formatKoboMajor(availableKobo))
    .replaceAll("{currency}", currencyTruth);

  return (
    <section className="acct-wal__vault" aria-label={copy.availableLabel}>
      <div className="acct-wal__vault-engrave" aria-hidden="true" />
      <div className="acct-wal__vault-glow" aria-hidden="true" />

      <div className="acct-wal__vault-inner">
        <header className="acct-wal__vault-top">
          <span className="acct-wal__vault-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M5 4h14l3 5-11 11L2 9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M2 9h20M9 4l2 16M15 4l-2 16M5 4l4 5M19 4l-4 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                opacity="0.55"
              />
            </svg>
            <span className="acct-wal__vault-wordmark">{copy.eyebrow}</span>
          </span>
          <span
            className="acct-wal__vault-sync"
            data-live={frozen ? "false" : "true"}
            title={frozen ? copy.onHoldLabel : copy.syncedAria}
          >
            <span className="acct-wal__vault-sync-dot" aria-hidden="true" />
            {frozen ? copy.onHoldLabel : copy.syncedLabel}
          </span>
        </header>

        <div className="acct-wal__vault-figure">
          <span className="acct-wal__vault-label">{copy.availableLabel}</span>
          <p className="acct-wal__vault-balance" aria-label={balanceAria}>
            <span className="acct-wal__vault-mark-cur" aria-hidden="true">
              ₦
            </span>
            <span className="acct-wal__vault-amount">{formatKoboMajor(availableKobo)}</span>
          </p>
          {approxAvailable ? (
            <p className="acct-wal__vault-approx">
              {fill(copy.approxTemplate, "amount", approxAvailable.formatted)}
              <span className="acct-wal__vault-approx-note">
                {approxAvailable.isStale ? copy.approxStaleNote : copy.approxNote}
              </span>
            </p>
          ) : (
            <p className="acct-wal__vault-approx acct-wal__vault-approx--settle">
              {copy.settlementNgn}
            </p>
          )}
        </div>

        <dl className="acct-wal__vault-stats">
          <div className="acct-wal__vault-stat">
            <dt>{copy.totalLabel}</dt>
            <dd>₦{formatKoboMajor(balanceKobo)}</dd>
          </div>
          {heldKobo > 0 ? (
            <div className="acct-wal__vault-stat">
              <dt>{copy.heldLabel}</dt>
              <dd>₦{formatKoboMajor(heldKobo)}</dd>
            </div>
          ) : null}
          {arrivingKobo > 0 ? (
            <div className="acct-wal__vault-stat acct-wal__vault-stat--arriving">
              <dt>{fill(copy.arrivingTemplate, "amount", `₦${formatKoboMajor(arrivingKobo)}`)}</dt>
              <dd aria-hidden="true" />
            </div>
          ) : null}
        </dl>

        <div className="acct-wal__vault-ctas">
          <Link className="acct-wal__vault-cta acct-wal__vault-cta--primary" href="/wallet/funding">
            <span className="acct-wal__vault-cta-icon" aria-hidden="true">
              <Plus size={16} strokeWidth={2.5} />
            </span>
            {copy.ctaFund}
          </Link>
          <Link className="acct-wal__vault-cta acct-wal__vault-cta--secondary" href="/wallet/withdrawals">
            <span className="acct-wal__vault-cta-icon" aria-hidden="true">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </span>
            {copy.ctaWithdraw}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WalletVault;
