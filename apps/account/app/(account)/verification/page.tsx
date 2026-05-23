import { translateSurfaceLabel } from "@henryco/i18n";
import {
  HeroCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import { getVerificationState } from "@/lib/verification";

import "@/components/verification/styles.css";
import DocumentSubmissionsClient from "@/components/verification/DocumentSubmissionsClient";
import { NextMoveCard } from "@/components/verification/NextMoveCard";
import { ReviewerNoteCard } from "@/components/verification/ReviewerNoteCard";
import { UnlocksRail } from "@/components/verification/UnlocksRail";
import {
  formatStamp,
  heroState,
  statusBlurb,
  statusEyebrow,
  statusHeadline,
} from "@/components/verification/helpers";

export const dynamic = "force-dynamic";

/**
 * Verification landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D). Lifts IdentityHero into the
 * shared <HeroCard /> primitive. Preserves Trust Journey + Unlocks +
 * NextMove + DocumentSubmissionsClient.
 */
export default async function VerificationPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [trust, verification] = await Promise.all([
    getAccountTrustProfile(user.id),
    getVerificationState(user.id),
  ]);
  const downloadHref =
    verification.submissions.length > 0 ? "/api/documents/kyc-summary/me" : null;
  const state = heroState(verification.status);
  const trustTierLabel = getTrustTierLabel(trust.tier);
  const nextTierLabel = trust.nextTier ? getTrustTierLabel(trust.nextTier) : null;

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "verified"
      ? "calm"
      : state === "pending"
        ? "active"
        : state === "rejected"
          ? "attention"
          : "empty";

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: t("Status"),
      value: t(statusEyebrow(verification.status)),
      foot: nextTierLabel ? `${t("Next")} · ${nextTierLabel}` : undefined,
      tone:
        state === "verified"
          ? "accent"
          : state === "pending"
            ? "active"
            : state === "rejected"
              ? "warning"
              : "default",
    },
    {
      label: t("Trust score"),
      value: `${trust.score}/100`,
      foot: trustTierLabel,
    },
    {
      label: t("Submitted"),
      value: formatStamp(verification.submittedAt),
      foot: verification.reviewedAt
        ? `${t("Reviewed")} ${formatStamp(verification.reviewedAt)}`
        : undefined,
    },
  ];

  // ── NextStepRow ─────────────────────────────────────────────────
  let nextStep: React.ReactNode = null;
  if (state === "none") {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={t("Identity verification")}
        title={t("Submit documents to start")}
        detail={t(
          "Wallet withdrawals, seller approval, employer verification, and higher-trust actions stay gated until your identity is reviewed against real documents.",
        )}
        href="#acct-ver-docs"
      />
    );
  } else if (state === "rejected") {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={t("Action needed")}
        title={t("Resubmit your documents")}
        detail={verification.reviewerNote ?? t("Review the note, replace the affected file, and resubmit — you stay on this page the whole time.")}
        href="#acct-ver-docs"
      />
    );
  }

  return (
    <DivisionLanding
      className="acct-ver acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={t(statusEyebrow(verification.status))}
          headline={t(statusHeadline(verification.status))}
          blurb={t(statusBlurb(verification.status))}
          ariaLabel={t("Identity verification overview")}
          ctaPrimary={
            verification.status === "verified" && downloadHref
              ? { label: t("Download summary"), href: downloadHref }
              : { label: t("Talk to support"), href: "/support" }
          }
          tiles={tiles}
          side={{
            kicker: t("Trust journey"),
            title: trustTierLabel,
            body: nextTierLabel
              ? `${t("Next")} · ${nextTierLabel}`
              : t("Top trust tier reached"),
          }}
          progress={{
            percent: trust.score,
            label: `${t("Trust score")} · ${trust.score}/100`,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        ...(verification.reviewerNote
          ? [
              {
                id: "acct-ver-reviewer-note",
                title: t("Reviewer note"),
                meta: t("From the review team"),
                content: <ReviewerNoteCard note={verification.reviewerNote} />,
              },
            ]
          : []),
        {
          id: "acct-ver-trust",
          title: t("Trust journey"),
          meta: t("What approval unlocks · what advances your tier"),
          content: (
            <div className="acct-ver__columns">
              <UnlocksRail approved={verification.status === "verified"} />
              <NextMoveCard requirements={trust.requirements} />
            </div>
          ),
        },
        {
          id: "acct-ver-docs",
          title: t("Documents"),
          meta: t("Uploads are async — you stay on this page while we review."),
          content: <DocumentSubmissionsClient initialVerification={verification} />,
        },
      ]}
    />
  );
}
