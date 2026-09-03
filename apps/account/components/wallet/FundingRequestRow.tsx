import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AccountCopy } from "@henryco/i18n/server";
import {
  formatKoboMajor,
  fundingStatusTone,
} from "./helpers";

type FundingRequest = {
  id: string;
  amount_kobo: number;
  status: string;
  reference: string | null;
  created_at: string;
};

type Props = {
  request: FundingRequest;
  copy: AccountCopy["wallet"]["funding"];
  statusLabels: AccountCopy["wallet"]["statusLabels"];
};

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

function formatCreated(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function localizedStatus(
  statusLabels: AccountCopy["wallet"]["statusLabels"],
  status: string | null | undefined,
): string {
  const key = typeof status === "string" && status.length > 0 ? status : "pending";
  const labels = statusLabels as Record<string, string | undefined>;
  return labels[key] ?? key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

export function FundingRequestRow({ request, copy, statusLabels }: Props) {
  const tone = fundingStatusTone(request.status);
  const label = localizedStatus(statusLabels, request.status);
  return (
    <Link
      href={`/wallet/funding/${request.id}`}
      className="acct-wal__funding-row"
      aria-label={format(copy.ariaLabelTemplate, {
        reference: request.reference || request.id.slice(0, 8),
        amount: formatKoboMajor(request.amount_kobo),
      })}
    >
      <div className="acct-wal__funding-meta">
        <div className="acct-wal__chip-row">
          <span className="acct-wal__chip" data-tone={tone}>
            {label}
          </span>
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
