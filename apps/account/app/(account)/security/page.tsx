import { Key, LogOut } from "lucide-react";

import {
  formatAccountTemplate,
  getAccountCopy,
  translateSurfaceLabel,
  type AppLocale,
} from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";

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
import { SecurityHero } from "@/components/security/SecurityHero";
import {
  type Signal,
  SignalsStrip,
} from "@/components/security/SignalsStrip";
import { TrustGuide } from "@/components/security/TrustGuide";
import ChangePasswordForm from "@/components/security/ChangePasswordForm";
import GlobalSignOutCard from "@/components/security/GlobalSignOutCard";

export const dynamic = "force-dynamic";

function riskWord(locale: AppLocale, fallback: string): string {
  const translated = translateSurfaceLabel(locale, "Risk");
  return translated && translated !== "Risk" ? translated.toLowerCase() : fallback.toLowerCase();
}

export default async function SecurityPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [logs, trust, profile] = await Promise.all([
    getSecurityLog(user.id, 12),
    getAccountTrustProfile(user.id),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });
  const events = logs.map((log) => buildSecurityEventView(log as Record<string, unknown>));
  const localizedReasons = getLocalizedTrustReasons(copy, trust);
  const localizedRequirements = getLocalizedTrustRequirements(copy, trust);
  const blockedActions = getLocalizedBlockedActions(copy, trust);
  const trustTierLabel = getLocalizedTrustTierLabel(copy, trust.tier);
  const nextTierLabel = trust.nextTier ? getLocalizedTrustTierLabel(copy, trust.nextTier) : null;

  const signals: Signal[] = [
    {
      label: copy.security.signalLabels.emailVerified,
      value: trust.signals.emailVerified
        ? copy.security.signalValues.confirmed
        : copy.security.signalValues.needsAttention,
      tone: trust.signals.emailVerified ? "good" : "risk",
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
          ? "good"
          : trust.signals.verificationStatus === "pending"
            ? "warn"
            : trust.signals.verificationStatus === "rejected"
              ? "risk"
              : "neutral",
    },
    {
      label: copy.security.signalLabels.trustedPhone,
      value: trust.signals.phonePresent
        ? copy.security.signalValues.present
        : copy.security.signalValues.missing,
      tone: trust.signals.phonePresent ? "info" : "risk",
    },
    {
      label: copy.security.signalLabels.profileCompletion,
      value: `${trust.signals.profileCompletion}%`,
      tone:
        trust.signals.profileCompletion >= 80
          ? "good"
          : trust.signals.profileCompletion >= 50
            ? "warn"
            : "neutral",
    },
    {
      label: copy.security.signalLabels.suspiciousEvents,
      value: `${trust.signals.suspiciousEvents}`,
      tone: trust.signals.suspiciousEvents > 0 ? "risk" : "good",
      foot:
        trust.signals.suspiciousEvents > 0
          ? t("Review the activity stream below.")
          : t("Nothing flagged in the last review window."),
    },
    {
      label: copy.security.signalLabels.contactReview,
      value:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? copy.security.signalValues.manualReview
          : copy.security.signalValues.clear,
      tone:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? "warn"
          : "good",
    },
  ];

  const regionalLine = `${region.countryName} · ${region.locale} · ${region.timezone}`;

  return (
    <div className="acct-sec acct-fade-in">
      <RouteLiveRefresh />
      <SecurityHero
        trust={trust}
        trustTierLabel={trustTierLabel}
        nextTierLabel={nextTierLabel}
        regionalLine={`${regionalLine}. ${region.settlementNote}`}
        email={user.email ?? null}
        accountAgeDays={trust.signals.accountAgeDays}
      />

      <section aria-labelledby="acct-sec-signals">
        <div className="acct-sec__section-head">
          <h2 id="acct-sec-signals" className="acct-sec__section-title">
            {t("Signals")}
          </h2>
          <span className="acct-sec__section-meta">
            {t("What our verification + scoring engines see on your account right now.")}
          </span>
        </div>
        <SignalsStrip signals={signals} />
      </section>

      <section aria-labelledby="acct-sec-guide">
        <div className="acct-sec__section-head">
          <h2 id="acct-sec-guide" className="acct-sec__section-title">
            {t("Where you are · what advances you")}
          </h2>
          <span className="acct-sec__section-meta">
            {t("Honest scoring, not a marketing number.")} {trustTierLabel}.
          </span>
        </div>
        <TrustGuide
          whereYouAre={{
            kicker: copy.security.whyYouAreHere,
            title: trustTierLabel,
            body: copy.security.whatCurrentStateBody,
            reasons:
              localizedReasons.length > 0 ? localizedReasons : [copy.security.baselineReason],
          }}
          whatUnlocksNext={{
            kicker: copy.security.whatToDoNext,
            title: trust.nextTier
              ? formatAccountTemplate(copy.security.whatUnlocks, { tier: nextTierLabel ?? "" })
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
      </section>

      <section aria-labelledby="acct-sec-actions">
        <div className="acct-sec__section-head">
          <h2 id="acct-sec-actions" className="acct-sec__section-title">
            {t("Account actions")}
          </h2>
          <span className="acct-sec__section-meta">{t("Routine controls you own directly.")}</span>
        </div>
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
      </section>

      <section aria-labelledby="acct-sec-activity">
        <div className="acct-sec__section-head">
          <h2 id="acct-sec-activity" className="acct-sec__section-title">
            {copy.security.recentActivity}
          </h2>
          <span className="acct-sec__section-meta">{copy.security.recentActivityDescription}</span>
        </div>
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
      </section>
    </div>
  );
}
