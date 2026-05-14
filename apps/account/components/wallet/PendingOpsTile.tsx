import Link from "next/link";
import { ArrowRight, Banknote, ShieldCheck } from "lucide-react";
import { formatKoboMajor } from "./helpers";

type Props = {
  pendingFundingKobo: number;
  pendingFundingCount: number;
  pendingWithdrawalKobo: number;
  pendingWithdrawalCount: number;
};

export function PendingOpsTiles({
  pendingFundingKobo,
  pendingFundingCount,
  pendingWithdrawalKobo,
  pendingWithdrawalCount,
}: Props) {
  return (
    <div className="acct-wal__pending">
      <div className="acct-wal__pending-tile">
        <div className="acct-wal__pending-head">
          <div>
            <p className="acct-wal__pending-kicker">Pending funding</p>
            <p className="acct-wal__pending-value">₦{formatKoboMajor(pendingFundingKobo)}</p>
          </div>
          <span className="acct-wal__pending-icon" aria-hidden>
            <ShieldCheck size={18} />
          </span>
        </div>
        <p className="acct-wal__pending-desc">
          {pendingFundingCount === 0
            ? "Funds you transfer in stay here until finance confirms the bank reference."
            : `${pendingFundingCount} request${
                pendingFundingCount === 1 ? "" : "s"
              } sitting in review — proof keeps the queue moving.`}
        </p>
        <Link href="/wallet/funding" className="acct-wal__pending-cta">
          Open funding lane <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
      <div className="acct-wal__pending-tile">
        <div className="acct-wal__pending-head">
          <div>
            <p className="acct-wal__pending-kicker">Pending withdrawals</p>
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
            ? "Withdrawals queue up here while finance reviews them — your available balance is never double-promised."
            : `${pendingWithdrawalCount} withdrawal${
                pendingWithdrawalCount === 1 ? "" : "s"
              } awaiting payout. Reserved off your available balance.`}
        </p>
        <Link href="/wallet/withdrawals" className="acct-wal__pending-cta">
          Open withdrawal lane <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
