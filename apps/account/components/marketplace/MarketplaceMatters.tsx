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

type MattersLabels = {
  ariaLabel: string;
  disputes: {
    kicker: string;
    titleTemplateSingular: string;
    titleTemplatePlural: string;
    bodyLatestTemplate: string;
    bodyFallback: string;
    cta: string;
  };
  application: {
    kicker: string;
    bodyWithStoreTemplate: string;
    bodyDefault: string;
    bodyReviewSuffixTemplate: string;
    cta: string;
    defaultStatus: string;
  };
  payouts: {
    kicker: string;
    titleTemplate: string;
    bodyTemplateSingular: string;
    bodyTemplatePlural: string;
    cta: string;
  };
  applicationStatusLabels: Record<string, string>;
  dash: string;
};

type Props = {
  disputes: ReadonlyArray<DisputeRow>;
  application: ApplicationRow;
  payouts: ReadonlyArray<PayoutRow>;
  marketplaceOrigin: string;
  labels: MattersLabels;
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function MarketplaceMatters({
  disputes,
  application,
  payouts,
  marketplaceOrigin,
  labels,
}: Props) {
  const openDisputes = disputes.filter((d) => disputeKind(d) !== "resolved");
  const pendingPayouts = payouts.filter((p) => payoutKind(p) === "pending");
  const showApplication =
    application !== null &&
    String(application.status || "").toLowerCase() !== "approved";

  if (openDisputes.length === 0 && pendingPayouts.length === 0 && !showApplication) {
    return null;
  }

  const localizeAppStatus = (raw: string | null): string => {
    if (!raw) return labels.application.defaultStatus;
    const key = raw.toLowerCase();
    return labels.applicationStatusLabels[key] ?? raw.replace(/_/g, " ");
  };

  const applicationToneStatus = String(application?.status || "").toLowerCase();

  return (
    <div className="acct-mkt__matters" role="list" aria-label={labels.ariaLabel}>
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
            <p className="acct-mkt__matter-kicker">{labels.disputes.kicker}</p>
          </div>
          <p className="acct-mkt__matter-title">
            {fill(
              openDisputes.length === 1
                ? labels.disputes.titleTemplateSingular
                : labels.disputes.titleTemplatePlural,
              { count: openDisputes.length },
            )}
          </p>
          <p className="acct-mkt__matter-body">
            {openDisputes[0]
              ? fill(labels.disputes.bodyLatestTemplate, {
                  ref: openDisputes[0].disputeNo || openDisputes[0].id.slice(0, 8),
                  stamp: formatStamp(openDisputes[0].updatedAt, labels.dash),
                })
              : labels.disputes.bodyFallback}
          </p>
          <span className="acct-mkt__matter-cta">
            {labels.disputes.cta} <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}

      {showApplication && application ? (
        <a
          key="application"
          href={`${marketplaceOrigin}/account/seller-application`}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-mkt__matter"
          data-tone={applicationToneStatus === "rejected" ? "risk" : "info"}
          role="listitem"
        >
          <div className="acct-mkt__matter-head">
            <span className="acct-mkt__matter-icon" aria-hidden>
              <FileCheck size={16} />
            </span>
            <p className="acct-mkt__matter-kicker">{labels.application.kicker}</p>
          </div>
          <p className="acct-mkt__matter-title">{localizeAppStatus(application.status)}</p>
          <p className="acct-mkt__matter-body">
            {application.storeName
              ? fill(labels.application.bodyWithStoreTemplate, { name: application.storeName })
              : labels.application.bodyDefault}
            {application.reviewNote
              ? fill(labels.application.bodyReviewSuffixTemplate, { note: application.reviewNote })
              : ""}
          </p>
          <span className="acct-mkt__matter-cta">
            {labels.application.cta} <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}

      {pendingPayouts.length > 0 ? (
        <a
          key="payouts"
          href={`${marketplaceOrigin}/vendor/payouts`}
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
            <p className="acct-mkt__matter-kicker">{labels.payouts.kicker}</p>
          </div>
          <p className="acct-mkt__matter-title">
            {fill(labels.payouts.titleTemplate, {
              amount: formatNaira(pendingPayouts.reduce((sum, p) => sum + p.amount, 0)),
            })}
          </p>
          <p className="acct-mkt__matter-body">
            {fill(
              pendingPayouts.length === 1
                ? labels.payouts.bodyTemplateSingular
                : labels.payouts.bodyTemplatePlural,
              { count: pendingPayouts.length },
            )}
          </p>
          <span className="acct-mkt__matter-cta">
            {labels.payouts.cta} <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      ) : null}
    </div>
  );
}
