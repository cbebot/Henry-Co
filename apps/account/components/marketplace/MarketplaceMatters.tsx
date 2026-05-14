import { AlertTriangle, ArrowUpRight, FileCheck, Wallet } from "lucide-react";

import {
  disputeKind,
  formatNaira,
  formatStamp,
  payoutKind,
  type ApplicationRow,
  type DisputeRow,
  type PayoutRow,
} from "./helpers";

type Props = {
  disputes: ReadonlyArray<DisputeRow>;
  application: ApplicationRow;
  payouts: ReadonlyArray<PayoutRow>;
  marketplaceOrigin: string;
};

export function MarketplaceMatters({ disputes, application, payouts, marketplaceOrigin }: Props) {
  const openDisputes = disputes.filter((d) => disputeKind(d) !== "resolved");
  const pendingPayouts = payouts.filter((p) => payoutKind(p) === "pending");
  const showApplication =
    application !== null &&
    String(application.status || "").toLowerCase() !== "approved";

  if (openDisputes.length === 0 && pendingPayouts.length === 0 && !showApplication) {
    return null;
  }

  return (
    <div className="acct-mkt__matters" role="list" aria-label="Active marketplace matters">
      {openDisputes.length > 0 ? (
        <a
          key="disputes"
          href={`${marketplaceOrigin}/account/disputes`}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-mkt__matter"
          data-tone="risk"
          role="listitem"
        >
          <div className="acct-mkt__matter-head">
            <span className="acct-mkt__matter-icon" aria-hidden>
              <AlertTriangle size={16} />
            </span>
            <p className="acct-mkt__matter-kicker">Disputes</p>
          </div>
          <p className="acct-mkt__matter-title">
            {openDisputes.length} {openDisputes.length === 1 ? "case" : "cases"} need action
          </p>
          <p className="acct-mkt__matter-body">
            {openDisputes[0]
              ? `Latest: ${openDisputes[0].disputeNo || openDisputes[0].id.slice(0, 8)} · updated ${formatStamp(openDisputes[0].updatedAt)}`
              : "Open the queue to add evidence."}
          </p>
          <span className="acct-mkt__matter-cta">
            Review cases <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}

      {showApplication && application ? (
        <a
          key="application"
          href={`${marketplaceOrigin}/sell/status`}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-mkt__matter"
          data-tone={String(application.status || "").toLowerCase() === "rejected" ? "risk" : "info"}
          role="listitem"
        >
          <div className="acct-mkt__matter-head">
            <span className="acct-mkt__matter-icon" aria-hidden>
              <FileCheck size={16} />
            </span>
            <p className="acct-mkt__matter-kicker">Seller application</p>
          </div>
          <p className="acct-mkt__matter-title">
            {(application.status || "submitted").replace(/_/g, " ")}
          </p>
          <p className="acct-mkt__matter-body">
            {application.storeName
              ? `Store: ${application.storeName}`
              : "Application in HenryCo review queue."}
            {application.reviewNote ? ` · ${application.reviewNote}` : ""}
          </p>
          <span className="acct-mkt__matter-cta">
            View status <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}

      {pendingPayouts.length > 0 ? (
        <a
          key="payouts"
          href={`${marketplaceOrigin}/seller/payouts`}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-mkt__matter"
          data-tone="warn"
          role="listitem"
        >
          <div className="acct-mkt__matter-head">
            <span className="acct-mkt__matter-icon" aria-hidden>
              <Wallet size={16} />
            </span>
            <p className="acct-mkt__matter-kicker">Payouts in review</p>
          </div>
          <p className="acct-mkt__matter-title">
            {formatNaira(pendingPayouts.reduce((sum, p) => sum + p.amount, 0))} pending
          </p>
          <p className="acct-mkt__matter-body">
            {pendingPayouts.length} request{pendingPayouts.length === 1 ? "" : "s"} awaiting finance verification.
          </p>
          <span className="acct-mkt__matter-cta">
            Open seller workspace <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}
    </div>
  );
}
