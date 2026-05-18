import { CheckCircle2, Clock3, FileCheck, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";

import { getAccountAppLocale } from "@/lib/locale-server";
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

export async function IdentityHero({ verification, trust, downloadHref }: Props) {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const state = heroState(verification.status);
  const StatusIcon = STATUS_ICONS[state];
  const fillPct = Math.max(0, Math.min(100, (trust.score / TRUST_SCORE_MAX) * 100));
  return (
    <section className="acct-ver__hero" data-state={state} aria-label={t("Identity verification overview")}>
      <div className="acct-ver__hero-inner">
        <div>
          <span className="acct-ver__hero-eyebrow">
            <span className="acct-ver__hero-eyebrow-dot" aria-hidden />
            {t(statusEyebrow(verification.status))}
          </span>
          <div className="acct-ver__hero-status-row">
            <span className="acct-ver__hero-status-icon" aria-hidden>
              <StatusIcon size={18} />
            </span>
            <h1 className="acct-ver__hero-headline">{t(statusHeadline(verification.status))}</h1>
          </div>
          <p className="acct-ver__hero-blurb">{t(statusBlurb(verification.status))}</p>
          {verification.submittedAt || verification.reviewedAt ? (
            <p className="acct-ver__hero-stamps">
              {verification.submittedAt ? (
                <span>
                  <FileCheck size={12} aria-hidden /> {t("Submitted")} {formatStamp(verification.submittedAt)}
                </span>
              ) : null}
              {verification.reviewedAt ? (
                <span>
                  <ShieldCheck size={12} aria-hidden /> {t("Reviewed")} {formatStamp(verification.reviewedAt)}
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="acct-ver__hero-actions">
            {verification.status === "verified" && downloadHref ? (
              <a className="acct-ver__cta acct-ver__cta--primary" href={downloadHref}>
                {t("Download summary")}
              </a>
            ) : (
              <Link href="/support" className="acct-ver__cta acct-ver__cta--primary">
                {t("Talk to support")}
              </Link>
            )}
            <Link href="/security" className="acct-ver__cta acct-ver__cta--ghost">
              {t("Security & access")}
            </Link>
          </div>
        </div>
        <aside className="acct-ver__hero-side" aria-label={t("Trust signal")}>
          <div className="acct-ver__hero-score">
            <div className="acct-ver__hero-score-head">
              <div>
                <p className="acct-ver__hero-score-label">{t("Trust score")}</p>
                <p className="acct-ver__hero-score-tier">{t(trust.tierLabel)}</p>
              </div>
              {trust.nextTierLabel ? (
                <p className="acct-ver__hero-score-tier" aria-label={`${t("Next tier:")} ${t(trust.nextTierLabel)}`}>
                  {t("Next")} · {t(trust.nextTierLabel)}
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
                ? `${t("Complete the next move below to advance to")} ${t(trust.nextTierLabel)}.`
                : t("You are at the highest tier our verification surface currently issues.")}
            </p>
          </div>
          <div className="acct-ver__hero-side-queue" role="list" aria-label={t("Submission queue summary")}>
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">{t("In review")}</span>
              <span className="acct-ver__hero-side-queue-tile-value">
                {verification.pendingSubmissionCount}
              </span>
            </div>
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">{t("Approved")}</span>
              <span className="acct-ver__hero-side-queue-tile-value">
                {verification.approvedSubmissionCount}
              </span>
            </div>
            <div className="acct-ver__hero-side-queue-tile" role="listitem">
              <span className="acct-ver__hero-side-queue-tile-label">{t("Rejected")}</span>
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
