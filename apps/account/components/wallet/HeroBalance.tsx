import { Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { AccountCopy } from "@henryco/i18n/server";
import { formatKoboMajor } from "./helpers";

type Props = {
  balanceKobo: number;
  pendingFundingKobo: number;
  pendingWithdrawalKobo: number;
  availableKobo: number;
  currency: string;
  settlementNote: string;
  copy: AccountCopy["wallet"]["hero"];
};

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function HeroBalance({
  balanceKobo,
  pendingFundingKobo,
  pendingWithdrawalKobo,
  availableKobo,
  currency,
  settlementNote,
  copy,
}: Props) {
  return (
    <section className="acct-wal__hero" aria-label={copy.ariaLabel}>
      <div className="acct-wal__hero-inner">
        <div className="acct-wal__hero-row">
          <div>
            <span className="acct-wal__hero-eyebrow">
              <span className="acct-wal__hero-eyebrow-dot" aria-hidden />
              {copy.eyebrow}
            </span>
            <p className="acct-wal__hero-label">{copy.availableLabel} · {currency}</p>
            <h1
              className="acct-wal__hero-balance"
              aria-label={format(copy.balanceAriaTemplate, {
                amount: formatKoboMajor(availableKobo),
                currency,
              })}
            >
              <span className="acct-wal__hero-currency" aria-hidden>
                ₦
              </span>
              {formatKoboMajor(availableKobo)}
            </h1>
            <p className="acct-wal__hero-settle">{settlementNote}</p>
          </div>
          <div className="acct-wal__hero-ctas">
            <Link href="/wallet/funding" className="acct-wal__cta acct-wal__cta--primary">
              <Plus size={16} aria-hidden /> {copy.ctas.fund}
            </Link>
            <Link href="/wallet/withdrawals" className="acct-wal__cta acct-wal__cta--ghost">
              <ArrowUpRight size={16} aria-hidden /> {copy.ctas.withdraw}
            </Link>
          </div>
        </div>
      </div>
      <div className="acct-wal__hero-split">
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">{copy.tiles.verifiedLabel}</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(balanceKobo)}</span>
          <span className="acct-wal__hero-tile-foot">{copy.tiles.verifiedFoot}</span>
        </div>
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">{copy.tiles.pendingFundingLabel}</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(pendingFundingKobo)}</span>
          <span className="acct-wal__hero-tile-foot">{copy.tiles.pendingFundingFoot}</span>
        </div>
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">{copy.tiles.pendingWithdrawalLabel}</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(pendingWithdrawalKobo)}</span>
          <span className="acct-wal__hero-tile-foot">{copy.tiles.pendingWithdrawalFoot}</span>
        </div>
      </div>
    </section>
  );
}
