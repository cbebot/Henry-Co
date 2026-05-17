import Link from "next/link";
import { ArrowRight, Banknote, ShieldCheck } from "lucide-react";
import type { AccountCopy } from "@henryco/i18n/server";
import { formatKoboMajor } from "./helpers";

type Props = {
  pendingFundingKobo: number;
  pendingFundingCount: number;
  pendingWithdrawalKobo: number;
  pendingWithdrawalCount: number;
  copy: AccountCopy["wallet"]["pendingOps"];
};

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function PendingOpsTiles({
  pendingFundingKobo,
  pendingFundingCount,
  pendingWithdrawalKobo,
  pendingWithdrawalCount,
  copy,
}: Props) {
  return (
    <div className="acct-wal__pending">
      <div className="acct-wal__pending-tile">
        <div className="acct-wal__pending-head">
          <div>
            <p className="acct-wal__pending-kicker">{copy.fundingKicker}</p>
            <p className="acct-wal__pending-value">₦{formatKoboMajor(pendingFundingKobo)}</p>
          </div>
          <span className="acct-wal__pending-icon" aria-hidden>
            <ShieldCheck size={18} />
          </span>
        </div>
        <p className="acct-wal__pending-desc">
          {pendingFundingCount === 0
            ? copy.fundingDescEmpty
            : format(
                pendingFundingCount === 1 ? copy.fundingDescSingular : copy.fundingDescPlural,
                { count: pendingFundingCount },
              )}
        </p>
        <Link href="/wallet/funding" className="acct-wal__pending-cta">
          {copy.fundingCta} <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
      <div className="acct-wal__pending-tile">
        <div className="acct-wal__pending-head">
          <div>
            <p className="acct-wal__pending-kicker">{copy.withdrawalKicker}</p>
            <p className="acct-wal__pending-value">
              {pendingWithdrawalKobo > 0 ? `₦${formatKoboMajor(pendingWithdrawalKobo)}` : "—"}
            </p>
          </div>
          <span className="acct-wal__pending-icon" aria-hidden>
            <Banknote size={18} />
          </span>
        </div>
        <p className="acct-wal__pending-desc">
          {pendingWithdrawalCount === 0
            ? copy.withdrawalDescEmpty
            : format(
                pendingWithdrawalCount === 1
                  ? copy.withdrawalDescSingular
                  : copy.withdrawalDescPlural,
                { count: pendingWithdrawalCount },
              )}
        </p>
        <Link href="/wallet/withdrawals" className="acct-wal__pending-cta">
          {copy.withdrawalCta} <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
