import { CheckCircle2, Clock3, FileCheck, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";

import type { VerificationState } from "@/lib/verification";
import {
  formatStamp,
  heroState,
  statusBlurb,
  statusEyebrow,
  statusHeadline,
} from "./helpers";

type TrustSummary = {
  tierLabel: string;
  score: number;
  nextTierLabel: string | null;
};

type Props = {
  verification: VerificationState;
  trust: TrustSummary;
  downloadHref: string | null;
};

const STATUS_ICONS = {
  verified: CheckCircle2,
  pending: Clock3,
  rejected: XCircle,
  none: ShieldCheck,
} as const;

const TRUST_SCORE_MAX = 100;

export function IdentityHero({ verification, trust, downloadHref }: Props) {
  const state = heroState(verification.status);
  const StatusIcon = STATUS_ICONS[state];
  const fillPct = Math.max(0, Math.min(100, (trust.score / TRUST_SCORE_MAX) * 100));
  return (
    <section className="acct-ver__hero" data-state={state} aria-label="Identity verification overview">
      <div className="acct-ver__hero-inner">
        <div>
          <span className="acct-ver__hero-eyebrow">
            <span className="acct-ver__hero-eyebrow-dot" aria-hidden />
            {statusEyebrow(verification.status)}
          </span>
          <div className="acct-ver__hero-status-row">
            <span className="acct-ver__hero-status-icon" aria-hidden>
              <StatusIcon size={18} />
            </span>
            <h1 className="acct-ver__hero-headline">{statusHeadline(verification.status)}</h1>
          </div>
          <p className="acct-ver__hero-blurb">{statusBlurb(verification.status)}</p>
          {verification.submittedAt || verification.reviewedAt ? (
            <p className="acct-ver__hero-stamps">
              {verification.submittedAt ? (
                <span>
                  <FileCheck size={12} aria-hidden /> Submitted {formatStamp(verification.submittedAt)}
                </span>
              ) : null}
              {verification.reviewedAt ? (
                <span>
                  <ShieldCheck size={12} aria-hidden /> Reviewed {formatStamp(verification.reviewedAt)}
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="acct-ver__hero-actions">
            {verification.status === "verified" && downloadHref ? (
              <a className="acct-ver__cta acct-ver__cta--primary" href={downloadHref}>
                Download summary
              </a>
            ) : (
              <Link href="/support" className="acct-ver__cta acct-ver__cta--primary">
                Talk to support
              </Link>
            )}
            <Link href="/security" className="acct-ver__cta acct-ver__cta--ghost">
              Security & access
            </Link>
          </div>
        </div>
        <aside className="acct-ver__hero-side" aria-label="Trust signal">
          <div className="acct-ver__hero-score">
            <div className="acct-ver__hero-score-head">
              <div>
                <p className="acct-ver__hero-score-label">Trust score</p>
                <p className="acct-ver__hero-score-tier">{trust.tierLabel}</p>
              </div>
              {trust.nextTierLabel ? (
                <p className="acct-ver__hero-score-tier" aria-label={`Next tier: ${trust.nextTierLabel}`}>
                  Next · {trust.nextTierLabel}
                </p>
              ) : null}
            </div>
            <p className="acct-ver__hero-score-value" aria-live="polite">
              {trust.score}
              <span className="acct-ver__hero-score-value-out">/ {TRUST_SCORE_MAX}</span>
            </p>
            <div className="acct-ver__hero-score-bar" aria-hidden>
              <span
                className="acct-ver__hero-score-bar-fill"
                style={{ transform: `scaleX(${fillPct / 100})` }}
              />
            </div>
            <p className="acct-ver__hero-score-foot">
              {trust.nextTierLabel
                ? `Complete the next move below to advance to ${trust.nextTierLabel}.`
                : "You are at the highest tier our verification surface currently issues."}
            </p>
          </div>
          <div className="acct-ver__hero-side-queue" role="list" aria-label="Submission queue summary">
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">In review</span>
              <span className="acct-ver__hero-side-queue-tile-value">
                {verification.pendingSubmissionCount}
              </span>
            </div>
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">Approved</span>
              <span className="acct-ver__hero-side-queue-tile-value">
                {verification.approvedSubmissionCount}
              </span>
            </div>
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">Rejected</span>
              <span className="acct-ver__hero-side-queue-tile-value">
                {verification.rejectedSubmissionCount}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
