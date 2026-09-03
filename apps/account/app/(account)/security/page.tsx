import { Key, LogOut, Laptop } from "lucide-react";
import { cookies } from "next/headers";

import {
  formatAccountTemplate,
  getAccountCopy,
  translateSurfaceLabel,
  type AppLocale,
} from "@henryco/i18n/server";
import { toBrandName } from "@henryco/config";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  MetricStrip,
  DivisionLanding,
  type HeroCardTile,
  type MetricStripCell,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getProfile, getSecurityLog } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  getLocalizedBlockedActions,
  getLocalizedTrustReasons,
  getLocalizedTrustRequirements,
  getLocalizedTrustTierLabel,
} from "@/lib/account-localization";
import { formatDateTime } from "@/lib/format";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import { buildSecurityEventView } from "@/lib/security-events";
import { securityMessageHref } from "@/lib/notification-center";
import { getAccountTrustProfile } from "@/lib/trust";

import "@/components/security/styles.css";
import { ActionZone } from "@/components/security/ActionZone";
import { ActivityList } from "@/components/security/ActivityList";
import { RestrictionsBanner } from "@/components/security/RestrictionsBanner";
import { TrustGuide } from "@/components/security/TrustGuide";
import { computeHeroState, statusBlurb, statusEyebrow, statusHeadline } from "@/components/security/helpers";
import ChangePasswordForm from "@/components/security/ChangePasswordForm";
import GlobalSignOutCard from "@/components/security/GlobalSignOutCard";
import EnableSecurityAlerts from "@/components/security/EnableSecurityAlerts";
import SignInReviewPanel from "@/components/security/SignInReviewPanel";
import RecognisedDevices, {
  type RecognisedDeviceItem,
} from "@/components/security/RecognisedDevices";
import { HC_DEVICE_COOKIE, verifyDeviceCookie } from "@/lib/security/device-cookie";
import { listKnownDevices, loadReviewEvent } from "@/lib/security/known-devices";

export const dynamic = "force-dynamic";

function riskWord(locale: AppLocale, fallback: string): string {
  const translated = translateSurfaceLabel(locale, "Risk");
  return translated && translated !== "Risk" ? translated.toLowerCase() : fallback.toLowerCase();
}

/**
 * Security landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D). Lifts SecurityHero into the
 * shared <HeroCard variant="paired" progress={trustScore} /> and swaps
 * SignalsStrip for <MetricStrip />.
 */
export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const params = await searchParams;
  const reviewId = typeof params.review === "string" ? params.review : null;
  const cookieStore = await cookies();
  const currentDeviceId = verifyDeviceCookie(cookieStore.get(HC_DEVICE_COOKIE)?.value);
  const [logs, trust, profile, knownDevices, reviewEvent] = await Promise.all([
    getSecurityLog(user.id, 12),
    getAccountTrustProfile(user.id),
    getProfile(user.id),
    listKnownDevices(user.id),
    reviewId ? loadReviewEvent(user.id, reviewId) : Promise.resolve(null),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });
  const events = logs.map((log) => buildSecurityEventView(log as Record<string, unknown>));
  const deviceItems: RecognisedDeviceItem[] = knownDevices.map((d) => ({
    deviceId: d.deviceId,
    label: d.label,
    locationLabel: d.firstCountry ?? null,
    lastSeenLabel: d.lastSeenAt
      ? formatDateTime(d.lastSeenAt, { locale: region.locale, timezone: region.timezone })
      : null,
    trusted: d.trusted,
    current: currentDeviceId !== null && d.deviceId === currentDeviceId,
  }));
  const reviewNode = reviewEvent ? (
    <SignInReviewPanel
      eventId={reviewEvent.eventId}
      deviceLabel={reviewEvent.deviceLabel}
      locationLabel={reviewEvent.locationSummary}
      whenLabel={
        reviewEvent.whenIso
          ? formatDateTime(reviewEvent.whenIso, { locale: region.locale, timezone: region.timezone })
          : null
      }
    />
  ) : null;
  const localizedReasons = getLocalizedTrustReasons(copy, trust);
  const localizedRequirements = getLocalizedTrustRequirements(copy, trust);
  const blockedActions = getLocalizedBlockedActions(copy, trust);
  const trustTierLabel = getLocalizedTrustTierLabel(copy, trust.tier);
  const nextTierLabel = trust.nextTier ? getLocalizedTrustTierLabel(copy, trust.nextTier) : null;

  const state = computeHeroState(trust);
  const heroTone: "calm" | "active" | "attention" =
    state === "secure" ? "calm" : state === "watch" ? "active" : "attention";

  // ── Hero tiles ───────────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: t("Trust tier"),
      value: trustTierLabel,
      foot: nextTierLabel ? `${t("Next")} · ${nextTierLabel}` : t("Top tier reached"),
      tone: "accent",
    },
    {
      label: t("Trust score"),
      value: `${trust.score}/100`,
      foot:
        trust.score >= 80
          ? t("Strong")
          : trust.score >= 50
            ? t("Healthy")
            : t("Light"),
    },
    {
      label: copy.security.signalLabels.suspiciousEvents,
      value: trust.signals.suspiciousEvents,
      foot:
        trust.signals.suspiciousEvents > 0
          ? t("Review the activity below")
          : t("Nothing flagged"),
      tone: trust.signals.suspiciousEvents > 0 ? "warning" : "default",
    },
    {
      label: t("Account age"),
      value: trust.signals.accountAgeDays,
      foot:
        trust.signals.accountAgeDays === 1
          ? t(toBrandName("day on Henry Onyx"))
          : t(toBrandName("days on Henry Onyx")),
    },
  ];

  // ── Signals strip (MetricStrip) ──────────────────────────────────
  const signalCells: ReadonlyArray<MetricStripCell> = [
    {
      label: copy.security.signalLabels.emailVerified,
      value: trust.signals.emailVerified
        ? copy.security.signalValues.confirmed
        : copy.security.signalValues.needsAttention,
      tone: trust.signals.emailVerified ? "success" : "warning",
    },
    {
      label: copy.security.signalLabels.identityStatus,
      value:
        trust.signals.verificationStatus === "verified"
          ? copy.security.signalValues.verified
          : trust.signals.verificationStatus === "pending"
            ? copy.security.signalValues.underReview
            : trust.signals.verificationStatus === "rejected"
              ? copy.security.signalValues.needsResubmission
              : copy.security.signalValues.notSubmitted,
      tone:
        trust.signals.verificationStatus === "verified"
          ? "success"
          : trust.signals.verificationStatus === "rejected"
            ? "danger"
            : "warning",
    },
    {
      label: copy.security.signalLabels.profileCompletion,
      value: `${trust.signals.profileCompletion}%`,
      tone:
        trust.signals.profileCompletion >= 80
          ? "success"
          : trust.signals.profileCompletion >= 50
            ? "default"
            : "warning",
    },
    {
      label: copy.security.signalLabels.contactReview,
      value:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? copy.security.signalValues.manualReview
          : copy.security.signalValues.clear,
      tone:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? "warning"
          : "success",
    },
  ];

  // ── NextStepRow: address top blocker ─────────────────────────────
  let nextStep: React.ReactNode = null;
  if (trust.signals.suspiciousEvents > 0) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={t("Review")}
        title={t("Suspicious events flagged")}
        detail={t("Look over the activity stream below, then rotate your password if anything looks unfamiliar.")}
        href="#acct-sec-activity"
      />
    );
  } else if (!trust.signals.emailVerified) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.security.signalLabels.emailVerified}
        title={t("Confirm your email")}
        detail={t("Email confirmation is required for higher-trust actions.")}
        cta={{ label: t("Open settings"), href: "/settings" }}
      />
    );
  } else if (
    trust.signals.verificationStatus !== "verified" &&
    trust.nextTier
  ) {
    nextStep = (
      <NextStepRow
        tone="neutral"
        kicker={t("Next move")}
        title={formatAccountTemplate(copy.security.whatUnlocks, {
          tier: nextTierLabel ?? "",
        })}
        detail={copy.security.whatToDoNextBody}
        cta={{ label: t("Open verification"), href: "/verification" }}
      />
    );
  }

  // A pending sign-in review takes priority over trust-progress nudges.
  if (reviewNode) nextStep = reviewNode;

  const regionalLine = `${region.countryName} · ${region.locale} · ${region.timezone}`;

  return (
    <DivisionLanding
      className="acct-sec acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={t(statusEyebrow(state))}
          headline={t(statusHeadline(state))}
          blurb={t(toBrandName(statusBlurb(state)))}
          ariaLabel={copy.security.heroAriaLabel}
          tiles={tiles}
          side={{
            kicker: t("Region"),
            title: trustTierLabel,
            body: `${regionalLine}. ${region.settlementNote}`,
          }}
          progress={{
            percent: trust.score,
            label: `${t("Trust score")} · ${trust.score}/100`,
          }}
        />
      }
      nextStep={nextStep}
      metrics={<MetricStrip cells={signalCells} ariaLabel={t("Security signals")} />}
      sections={[
        {
          id: "acct-sec-guide",
          title: t("Where you are · what advances you"),
          meta: `${t("Honest scoring, not a marketing number.")} ${trustTierLabel}.`,
          content: (
            <>
              <TrustGuide
                whereYouAre={{
                  kicker: copy.security.whyYouAreHere,
                  title: trustTierLabel,
                  body: copy.security.whatCurrentStateBody,
                  reasons:
                    localizedReasons.length > 0
                      ? localizedReasons
                      : [copy.security.baselineReason],
                }}
                whatUnlocksNext={{
                  kicker: copy.security.whatToDoNext,
                  title: trust.nextTier
                    ? formatAccountTemplate(copy.security.whatUnlocks, {
                        tier: nextTierLabel ?? "",
                      })
                    : copy.security.topTrustLaneReached,
                  body: trust.nextTier
                    ? copy.security.whatToDoNextBody
                    : copy.security.topTrustLaneDescription,
                  requirements:
                    localizedRequirements.length > 0
                      ? localizedRequirements
                      : trust.nextTier
                        ? []
                        : [copy.security.topTrustLaneDescription],
                }}
              />
              <div style={{ marginTop: 20 }}>
                <RestrictionsBanner
                  blocked={blockedActions}
                  clearLabel={copy.security.noRestrictions}
                  restrictedKicker={copy.security.currentRestrictions}
                  clearKicker={t("All lanes open")}
                />
              </div>
            </>
          ),
        },
        {
          id: "acct-sec-actions",
          title: t("Account actions"),
          meta: t("Routine controls you own directly."),
          content: (
            <div className="acct-sec__actions">
              <ActionZone
                kicker={copy.changePassword.updatePassword}
                title={t("Change your password")}
                icon={Key}
              >
                <ChangePasswordForm />
              </ActionZone>
              <ActionZone
                kicker={copy.globalSignOut.title}
                title={t("Sign out everywhere")}
                icon={LogOut}
              >
                <GlobalSignOutCard />
              </ActionZone>
            </div>
          ),
        },
        {
          id: "acct-sec-devices",
          title: t("Recognised devices"),
          meta: t("Browsers and apps you've signed in from. Remove any you don't recognise."),
          content: (
            <div className="acct-sec__devices flex flex-col gap-4">
              <EnableSecurityAlerts />
              <ActionZone
                kicker={t("Your devices")}
                title={t("Recognised devices")}
                icon={Laptop}
              >
                <RecognisedDevices devices={deviceItems} />
              </ActionZone>
            </div>
          ),
        },
        {
          id: "acct-sec-activity",
          title: copy.security.recentActivity,
          meta: copy.security.recentActivityDescription,
          content:
            events.length === 0 ? (
              <EmptyStateCard
                kicker={copy.security.recentActivity}
                title={copy.security.emptyTitle}
                body={copy.security.emptyDescription}
              />
            ) : (
              <ActivityList
                events={events}
                emptyTitle={copy.security.emptyTitle}
                emptyDescription={copy.security.emptyDescription}
                riskWord={riskWord(locale, copy.security.risk)}
                href={securityMessageHref}
                formatDateTime={(iso: string) =>
                  formatDateTime(iso, { locale: region.locale, timezone: region.timezone })
                }
              />
            ),
        },
      ]}
      footer={<RouteLiveRefresh />}
    />
  );
}
