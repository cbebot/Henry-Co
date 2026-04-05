import Link from "next/link";
import { Shield, Key, Smartphone, Clock, Globe, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSecurityLog } from "@/lib/account-data";
import { formatDateTime } from "@/lib/format";
import { buildSecurityEventView } from "@/lib/security-events";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import { securityMessageHref } from "@/lib/notification-center";
import PageHeader from "@/components/layout/PageHeader";
import ChangePasswordForm from "@/components/security/ChangePasswordForm";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await requireAccountUser();
  const [logs, trust] = await Promise.all([
    getSecurityLog(user.id, 10),
    getAccountTrustProfile(user.id),
  ]);
  const events = logs.map((log) => buildSecurityEventView(log as Record<string, unknown>));
  const securitySignals = [
    {
      label: "Verified email",
      value: trust.signals.emailVerified ? "Confirmed" : "Needs attention",
      tone: trust.signals.emailVerified ? "var(--acct-green)" : "var(--acct-red)",
    },
    {
      label: "Trusted phone",
      value: trust.signals.phonePresent ? "Present" : "Missing",
      tone: trust.signals.phonePresent ? "var(--acct-blue)" : "var(--acct-red)",
    },
    {
      label: "Profile completion",
      value: `${trust.signals.profileCompletion}%`,
      tone: "var(--acct-gold)",
    },
    {
      label: "Suspicious events",
      value: `${trust.signals.suspiciousEvents}`,
      tone: trust.signals.suspiciousEvents > 0 ? "var(--acct-red)" : "var(--acct-green)",
    },
  ];

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Security"
        description="Manage your password, sessions, and account security."
        icon={Shield}
      />

      {/* Security overview */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="acct-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">Trust Profile</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
                {getTrustTierLabel(trust.tier)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--acct-muted)]">
                Trust is operational across the account. It now controls higher-value business actions,
                moderation posture, and stronger eligibility across HenryCo modules.
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--acct-blue-soft)] px-4 py-3 text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-blue)]">
                Account trust score
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
                <p className="text-sm font-semibold text-[var(--acct-ink)]">Why you are here</p>
              </div>
              <div className="mt-3 space-y-2">
                {(trust.reasons.length > 0 ? trust.reasons : ["Your baseline account profile is active."]).map((reason) => (
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
                  {trust.nextTier ? `What unlocks ${getTrustTierLabel(trust.nextTier)}` : "Top trust lane reached"}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {(trust.requirements.length > 0
                  ? trust.requirements
                  : ["This account already meets the current highest trust lane available in the shared dashboard."]).map(
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="acct-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-green-soft)]">
              <Shield size={20} className="text-[var(--acct-green)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Account status</p>
              <p
                className="text-xs"
                style={{
                  color:
                    trust.signals.suspiciousEvents > 0 ? "var(--acct-red)" : "var(--acct-green)",
                }}
              >
                {trust.signals.suspiciousEvents > 0 ? "Needs review" : "Secure"}
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
              <p className="text-sm font-semibold">Email</p>
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
              <p className="text-sm font-semibold">Account history</p>
              <p className="text-xs text-[var(--acct-muted)]">
                {trust.signals.accountAgeDays} day{trust.signals.accountAgeDays === 1 ? "" : "s"} of account history
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
              <p className="text-sm font-semibold">Operational access</p>
              <p className="text-xs text-[var(--acct-muted)]">
                {trust.flags.jobsPostingEligible ? "Higher-trust business actions available" : "More verification needed"}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Change password */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Change Password</p>
        <ChangePasswordForm />
      </section>

      {/* Recent security events */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Recent Security Events</p>
        {events.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No recent security events"
            description="Sign-ins, session closures, alerts, and sensitive account changes will appear here."
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
                      {event.riskLevel} risk
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {event.deviceSummary} · {event.locationSummary}
                  </p>
                  <p className="mt-1 text-[0.72rem] text-[var(--acct-muted)]">
                    {event.ipAddress ? `${event.ipAddress} · ` : ""}
                    {formatDateTime(event.createdAt)}
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
