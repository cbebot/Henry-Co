import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  formatKoboMajor,
  fundingStatusTone,
  statusReadable,
} from "./helpers";

type FundingRequest = {
  id: string;
  amount_kobo: number;
  status: string;
  reference: string | null;
  proof_url?: string | null;
  created_at: string;
};

type Props = {
  request: FundingRequest;
};

function formatCreated(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FundingRequestRow({ request }: Props) {
  const tone = fundingStatusTone(request.status);
  const label = statusReadable(request.status);
  return (
    <Link
      href={`/wallet/funding/${request.id}`}
      className="acct-wal__funding-row"
      aria-label={`Funding request ${request.reference || request.id.slice(0, 8)} for ₦${formatKoboMajor(
        request.amount_kobo,
      )}`}
    >
      <div className="acct-wal__funding-meta">
        <div className="acct-wal__chip-row">
          <span className="acct-wal__chip" data-tone={tone}>
            {label}
          </span>
          {request.proof_url ? (
            <span className="acct-wal__chip" data-tone="success">
              Proof uploaded
            </span>
          ) : (
            <span className="acct-wal__chip" data-tone="warn">
              Awaiting proof
            </span>
          )}
        </div>
        <span className="acct-wal__funding-amount">₦{formatKoboMajor(request.amount_kobo)}</span>
        <span className="acct-wal__funding-ref">
          {request.reference || request.id.slice(0, 8).toUpperCase()} · {formatCreated(request.created_at)}
        </span>
      </div>
      <span className="acct-wal__funding-arrow" aria-hidden>
        <ArrowRight size={14} />
      </span>
    </Link>
  );
}
