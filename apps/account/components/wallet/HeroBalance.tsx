import { Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatKoboMajor } from "./helpers";

type Props = {
  balanceKobo: number;
  pendingFundingKobo: number;
  pendingWithdrawalKobo: number;
  availableKobo: number;
  currency: string;
  settlementNote: string;
};

export function HeroBalance({
  balanceKobo,
  pendingFundingKobo,
  pendingWithdrawalKobo,
  availableKobo,
  currency,
  settlementNote,
}: Props) {
  return (
    <section className="acct-wal__hero" aria-label="Wallet balance">
      <div className="acct-wal__hero-inner">
        <div className="acct-wal__hero-row">
          <div>
            <span className="acct-wal__hero-eyebrow">
              <span className="acct-wal__hero-eyebrow-dot" aria-hidden />
              HenryCo wallet · live
            </span>
            <p className="acct-wal__hero-label">Available balance · {currency}</p>
            <h1
              className="acct-wal__hero-balance"
              aria-label={`Available balance ${formatKoboMajor(availableKobo)} ${currency}`}
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
              <Plus size={16} aria-hidden /> Fund wallet
            </Link>
            <Link href="/wallet/withdrawals" className="acct-wal__cta acct-wal__cta--ghost">
              <ArrowUpRight size={16} aria-hidden /> Withdraw
            </Link>
          </div>
        </div>
      </div>
      <div className="acct-wal__hero-split">
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">Verified balance</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(balanceKobo)}</span>
          <span className="acct-wal__hero-tile-foot">Spendable across HenryCo services</span>
        </div>
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">Pending funding</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(pendingFundingKobo)}</span>
          <span className="acct-wal__hero-tile-foot">Sits separately until finance confirms</span>
        </div>
        <div className="acct-wal__hero-tile">
          <span className="acct-wal__hero-tile-label">Held for withdrawal</span>
          <span className="acct-wal__hero-tile-value">₦{formatKoboMajor(pendingWithdrawalKobo)}</span>
          <span className="acct-wal__hero-tile-foot">Reserved until payout clears</span>
        </div>
      </div>
    </section>
  );
}
