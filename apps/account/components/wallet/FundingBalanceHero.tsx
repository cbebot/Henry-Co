import { ArrowDownToLine } from "lucide-react";

import { formatKoboMajor } from "./helpers";

/**
 * FundingBalanceHero — the lead card on the "Add money" surface.
 *
 * Leads with the customer's available wallet balance (NGN settlement truth) so
 * the top-up that follows has clear context, and surfaces any in-flight top-up
 * as an "arriving" pill. This is a calm, token-driven balance card — NOT the
 * onyx vault, which the design system reserves as the single signature on the
 * main wallet (inner pages stay calmer so the hierarchy reads clearly).
 *
 * MONEY INVARIANT: every figure is rendered from server-confirmed kobo; nothing
 * is computed or mutated here.
 */
export type FundingBalanceHeroCopy = {
  availableLabel: string;
  /** "{amount} on hold for withdrawals" — interpolated with a formatted ₦ figure. */
  heldTemplate: string;
  settlementNote: string;
  /** "{amount} arriving" — interpolated with a formatted ₦ figure. */
  arrivingTemplate: string;
};

type FundingBalanceHeroProps = {
  availableKobo: number;
  heldKobo: number;
  arrivingKobo: number;
  copy: FundingBalanceHeroCopy;
};

function fill(template: string, value: string): string {
  return template.replaceAll("{amount}", value);
}

export function FundingBalanceHero({ availableKobo, heldKobo, arrivingKobo, copy }: FundingBalanceHeroProps) {
  return (
    <section className="acct-wal__fund-balance" aria-label={copy.availableLabel}>
      <div className="acct-wal__fund-balance-lead">
        <span className="acct-wal__fund-balance-label">{copy.availableLabel}</span>
        <p className="acct-wal__fund-balance-value">
          <span className="acct-wal__fund-balance-cur" aria-hidden="true">₦</span>
          <span className="acct-wal__fund-balance-amt">{formatKoboMajor(availableKobo)}</span>
        </p>
        <span className="acct-wal__fund-balance-sub">
          {heldKobo > 0 ? fill(copy.heldTemplate, `₦${formatKoboMajor(heldKobo)}`) : copy.settlementNote}
        </span>
      </div>

      {arrivingKobo > 0 ? (
        <div className="acct-wal__fund-balance-aside">
          <span className="acct-wal__fund-arriving">
            <span className="acct-wal__fund-arriving-dot" aria-hidden="true" />
            <ArrowDownToLine size={14} aria-hidden="true" />
            {fill(copy.arrivingTemplate, `₦${formatKoboMajor(arrivingKobo)}`)}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export default FundingBalanceHero;
