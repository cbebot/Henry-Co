import Link from "next/link";
import { Shield, Key, Smartphone, Clock, Globe, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  formatAccountTemplate,
  getAccountCopy,
  translateSurfaceLabel,
  type AppLocale,
} from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getSecurityLog } from "@/lib/account-data";
import { formatDateTime } from "@/lib/format";
import { buildSecurityEventView } from "@/lib/security-events";
import { getAccountTrustProfile } from "@/lib/trust";
import { securityMessageHref } from "@/lib/notification-center";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import {
  getLocalizedBlockedActions,
  getLocalizedTrustReasons,
  getLocalizedTrustRequirements,
  getLocalizedTrustTierLabel,
} from "@/lib/account-localization";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import ChangePasswordForm from "@/components/security/ChangePasswordForm";
import GlobalSignOutCard from "@/components/security/GlobalSignOutCard";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

function getRiskLabel(locale: AppLocale, riskLevel: string, riskWord: string) {
  const normalized = String(riskLevel || "").trim().toLowerCase();
  const phraseByLevel: Record<string, string> = {
    high: "High risk",
    medium: "Medium risk",
    low: "Low risk",
  };

  const translatedPhrase = translateSurfaceLabel(locale, phraseByLevel[normalized] || "");
  if (translatedPhrase && translatedPhrase !== phraseByLevel[normalized]) {
    return translatedPhrase;
  }

  return `${riskLevel} ${riskWord}`;
}

export default async function SecurityPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
  const [logs, trust, profile] = await Promise.all([
    getSecurityLog(user.id, 10),
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
  const securitySignals = [
    {
      label: copy.security.signalLabels.emailVerified,
      value: trust.signals.emailVerified ? copy.security.signalValues.confirmed : copy.security.signalValues.needsAttention,
      tone: trust.signals.emailVerified ? "var(--acct-green)" : "var(--acct-red)",
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
          ? "var(--acct-green)"
          : trust.signals.verificationStatus === "pending"
            ? "var(--acct-gold)"
            : "var(--acct-red)",
    },
    {
      label: copy.security.signalLabels.trustedPhone,
      value: trust.signals.phonePresent ? copy.security.signalValues.present : copy.security.signalValues.missing,
      tone: trust.signals.phonePresent ? "var(--acct-blue)" : "var(--acct-red)",
    },
    {
      label: copy.security.signalLabels.profileCompletion,
      value: `${trust.signals.profileCompletion}%`,
      tone: "var(--acct-gold)",
    },
    {
      label: copy.security.signalLabels.suspiciousEvents,
      value: `${trust.signals.suspiciousEvents}`,
      tone: trust.signals.suspiciousEvents > 0 ? "var(--acct-red)" : "var(--acct-green)",
    },
    {
      label: copy.security.signalLabels.contactReview,
      value:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? copy.security.signalValues.manualReview
          : copy.security.signalValues.clear,
      tone:
        trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
          ? "var(--acct-gold)"
          : "var(--acct-green)",
    },
  ];
  const blockedActions = getLocalizedBlockedActions(copy, trust);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <PageHeader
        title={copy.security.title}
        description={copy.security.description}
        icon={Shield}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="acct-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">{copy.security.trustProfile}</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
                {getLocalizedTrustTierLabel(copy, trust.tier)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--acct-muted)]">
                {copy.security.trustDescription}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--acct-blue-soft)] px-4 py-3 text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-blue)]">
                {copy.security.trustScore}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--acct-ink)]">{trust.score}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {securitySignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                  {signal.label}
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: signal.tone }}>
                  {signal.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--acct-green)]" />
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{copy.security.whyYouAreHere}</p>
              </div>
              <div className="mt-3 space-y-2">
                {(localizedReasons.length > 0 ? localizedReasons : [copy.security.baselineReason]).map((reason) => (
                  <p key={reason} className="text-sm leading-7 text-[var(--acct-muted)]">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--acct-bg-elevated)] p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--acct-gold)]" />
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {trust.nextTier
                    ? formatAccountTemplate(copy.security.whatUnlocks, {
                        tier: getLocalizedTrustTierLabel(copy, trust.nextTier),
                      })
                    : copy.security.topTrustLaneReached}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {(localizedRequirements.length > 0
                  ? localizedRequirements
                  : [copy.security.topTrustLaneDescription]).map(
                  (requirement) => (
                    <p key={requirement} className="text-sm leading-7 text-[var(--acct-muted)]">
                      {requirement}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="acct-card p-5">
          <p className="acct-kicker">{copy.security.regionalContext}</p>
          <div className="mt-3 rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 text-sm leading-7 text-[var(--acct-muted)]">
            {region.countryName} · {region.locale} · {region.timezone}. {region.settlementNote}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="acct-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-green-soft)]">
                <Shield size={20} className="text-[var(--acct-green)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{copy.security.accountStatus}</p>
                <p
                  className="text-xs"
                  style={{
                    color:
                      trust.signals.suspiciousEvents > 0 ? "var(--acct-red)" : "var(--acct-green)",
                  }}
                >
                  {trust.signals.suspiciousEvents > 0 ? copy.security.needsReview : copy.security.secure}
                </p>
              </div>
            </div>
          </div>
          <div className="acct-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-blue-soft)]">
                <Key size={20} className="text-[var(--acct-blue)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{copy.security.email}</p>
                <p className="text-xs text-[var(--acct-muted)]">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="acct-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-purple-soft)]">
                <Clock size={20} className="text-[var(--acct-purple)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{copy.security.accountHistory}</p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {formatAccountTemplate(copy.security.historyDays, {
                    days: trust.signals.accountAgeDays,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="acct-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
                <Smartphone size={20} className="text-[var(--acct-gold)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{copy.security.operationalAccess}</p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {trust.flags.jobsPostingEligible && trust.flags.payoutEligible
                    ? copy.security.higherTrustAvailable
                    : copy.security.moreVerificationNeeded}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="acct-card p-5">
        <p className="acct-kicker">{copy.security.trustGuide}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{copy.security.whatCurrentStateMeans}</p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">
              {getLocalizedTrustTierLabel(copy, trust.tier)}. {copy.security.whatCurrentStateBody}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{copy.security.whatToDoNext}</p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">
              {trust.nextTier
                ? `${copy.security.whatToDoNextBody} ${getLocalizedTrustTierLabel(copy, trust.nextTier)}.`
                : copy.security.topTrustLaneDescription}
            </p>
          </div>
        </div>
        {blockedActions.length > 0 ? (
          <div className="mt-4 rounded-[1.4rem] border border-[var(--acct-red)]/20 bg-[var(--acct-red-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-red)]">{copy.security.currentRestrictions}</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--acct-muted)]">
              {blockedActions.map((action) => (
                <li key={action}>- {action}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-[1.4rem] border border-[var(--acct-green)]/25 bg-[var(--acct-green-soft)] p-4">
            <p className="text-sm text-[var(--acct-muted)]">
              {copy.security.noRestrictions}
            </p>
          </div>
        )}
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">{copy.changePassword.updatePassword}</p>
        <ChangePasswordForm />
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">{copy.globalSignOut.title}</p>
        <GlobalSignOutCard />
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker mb-2">{copy.security.recentActivity}</p>
        <p className="mb-4 text-sm leading-7 text-[var(--acct-muted)]">
          {copy.security.recentActivityDescription}
        </p>
        {events.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={copy.security.emptyTitle}
            description={copy.security.emptyDescription}
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={securityMessageHref(event.id)}
                className="flex items-center gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition hover:bg-[var(--acct-bg-elevated)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-bg-elevated)]">
                  <Globe size={16} className="text-[var(--acct-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{event.title}</p>
                    <span
                      className="rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor:
                          event.riskLevel === "high"
                            ? "var(--acct-red-soft)"
                            : event.riskLevel === "medium"
                              ? "var(--acct-gold-soft)"
                              : "var(--acct-green-soft)",
                        color:
                          event.riskLevel === "high"
                            ? "var(--acct-red)"
                            : event.riskLevel === "medium"
                            ? "var(--acct-gold)"
                              : "var(--acct-green)",
                      }}
                    >
                      {getRiskLabel(locale, event.riskLevel, copy.security.risk)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {event.deviceSummary} · {event.locationSummary}
                  </p>
                  <p className="mt-1 text-[0.72rem] text-[var(--acct-muted)]">
                    {event.ipAddress ? `${event.ipAddress} · ` : ""}
                    {formatDateTime(event.createdAt, {
                      locale: region.locale,
                      timezone: region.timezone,
                    })}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--acct-muted)]" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
