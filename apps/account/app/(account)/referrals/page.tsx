import { Users, Gift, Clock, CheckCircle, XCircle, ShieldAlert, Sparkles } from "lucide-react";
import { getAccountCopy, formatAccountTemplate } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import {
  getUserReferralCode,
  getUserReferrals,
  getReferralRewards,
  getReferralStats,
  REFERRAL_QUALIFY_HOLD_DAYS,
  REFERRAL_REWARD_KOBO,
} from "@/lib/referral-data";
import { formatNaira, formatDate } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import CopyReferralCode from "@/components/referral/CopyReferralCode";

export const dynamic = "force-dynamic";

const statusChip: Record<string, string> = {
  pending: "acct-chip-gold",
  converted: "acct-chip-orange",
  qualified: "acct-chip-green",
  flagged: "acct-chip-red",
  expired: "acct-chip-red",
};
const rewardChip: Record<string, string> = {
  held: "acct-chip-orange",
  pending: "acct-chip-orange",
  released: "acct-chip-green",
  paid: "acct-chip-green",
  cancelled: "acct-chip-red",
};
const statusIcon: Record<string, typeof Clock> = {
  pending: Clock,
  converted: Sparkles,
  qualified: CheckCircle,
  flagged: ShieldAlert,
  expired: XCircle,
};

export default async function ReferralsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).referrals;

  const [code, referrals, rewards, stats] = await Promise.all([
    getUserReferralCode(user.id),
    getUserReferrals(user.id),
    getReferralRewards(user.id),
    getReferralStats(user.id),
  ]);

  const referralsWithReferee = referrals.filter(
    (r: Record<string, unknown>) => r.referee_id != null || r.status === "flagged"
  );

  const rewardAmount = formatNaira(REFERRAL_REWARD_KOBO);

  const statusLabel: Record<string, string> = {
    pending: copy.statusLabels.pending,
    converted: copy.statusLabels.converted,
    qualified: copy.statusLabels.qualified,
    flagged: copy.statusLabels.flagged,
    expired: copy.statusLabels.expired,
  };
  const flagReasonLabel: Record<string, string> = {
    self_referral: copy.flagReasons.selfReferral,
    duplicate_email: copy.flagReasons.duplicateEmail,
    device_reuse: copy.flagReasons.deviceReuse,
  };
  const rewardStatusLabel: Record<string, string> = {
    held: copy.rewards.statusLabels.held,
    pending: copy.rewards.statusLabels.pending,
    released: copy.rewards.statusLabels.released,
    paid: copy.rewards.statusLabels.paid,
    cancelled: copy.rewards.statusLabels.cancelled,
  };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.hero.title}
        description={copy.hero.description}
        icon={Users}
      />

      {/* Referral Code Card */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">{copy.code.eyebrow}</p>
        <CopyReferralCode code={code} copy={copy.code} />
        <p className="mt-3 text-xs text-[var(--acct-muted)]">
          {formatAccountTemplate(copy.code.rewardNote, {
            amount: rewardAmount,
            days: REFERRAL_QUALIFY_HOLD_DAYS,
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.totalReferred}
          </p>
          <p className="hc-mono mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
            {stats.totalReferred}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.signedUp}
          </p>
          <p className="hc-mono mt-1 text-2xl font-semibold text-[var(--acct-ink)]">
            {stats.converted}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.qualified}
          </p>
          <p className="hc-mono mt-1 text-2xl font-semibold text-emerald-600">
            {stats.qualified}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.flagged}
          </p>
          <p className="hc-mono mt-1 text-2xl font-semibold text-[var(--acct-alert,#E85858)]">
            {stats.flagged}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.pendingRewards}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--acct-gold)]">
            {formatNaira(stats.pendingRewards)}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            {copy.stats.releasedRewards}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatNaira(stats.paidRewards)}
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">{copy.howItWorks.eyebrow}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-semibold text-[var(--acct-gold)]">
              1
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              {copy.howItWorks.step1Title}
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">{copy.howItWorks.step1Body}</p>
          </div>
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-semibold text-[var(--acct-gold)]">
              2
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              {copy.howItWorks.step2Title}
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              {formatAccountTemplate(copy.howItWorks.step2Body, {
                days: REFERRAL_QUALIFY_HOLD_DAYS,
              })}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-semibold text-[var(--acct-gold)]">
              3
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              {copy.howItWorks.step3Title}
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              {formatAccountTemplate(copy.howItWorks.step3Body, { amount: rewardAmount })}
            </p>
          </div>
        </div>
      </div>

      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">{copy.policy.eyebrow}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[copy.policy.qualifying, copy.policy.enforcement, copy.policy.separation].map((item) => (
            <div
              key={item}
              className="rounded-xl bg-[var(--acct-surface)] p-4 text-sm leading-7 text-[var(--acct-muted)]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <div>
        <p className="acct-kicker mb-3">{copy.referralsList.eyebrow}</p>
        {referralsWithReferee.length === 0 ? (
          <EmptyState
            icon={Users}
            title={copy.referralsList.emptyTitle}
            description={copy.referralsList.emptyDescription}
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {referralsWithReferee.map(
              (referral: Record<string, string | number | null>) => {
                const status = String(referral.status || "pending");
                const StatusIcon = statusIcon[status] || Clock;
                const label = statusLabel[status] || status;
                const flagReason = referral.flag_reason
                  ? flagReasonLabel[String(referral.flag_reason)] ||
                    String(referral.flag_reason)
                  : null;
                return (
                  <div
                    key={referral.id as string}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-surface)]">
                      <StatusIcon
                        size={18}
                        className={
                          status === "flagged"
                            ? "text-[var(--acct-alert,#E85858)]"
                            : status === "qualified"
                              ? "text-emerald-600"
                              : "text-[var(--acct-muted)]"
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {referral.referee_email
                          ? String(referral.referee_email)
                          : copy.referralsList.refereeFallback}
                      </p>
                      <p className="text-xs text-[var(--acct-muted)]">
                        {referral.created_at
                          ? formatDate(referral.created_at as string)
                          : ""}
                        {referral.converted_at
                          ? ` · ${formatAccountTemplate(copy.referralsList.signedUpTemplate, {
                              date: formatDate(referral.converted_at as string),
                            })}`
                          : ""}
                        {referral.qualified_at
                          ? ` · ${formatAccountTemplate(copy.referralsList.qualifiedTemplate, {
                              date: formatDate(referral.qualified_at as string),
                            })}`
                          : ""}
                        {flagReason ? ` · ${flagReason}` : ""}
                      </p>
                    </div>
                    <span
                      className={`acct-chip ${statusChip[status] || "acct-chip-gold"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Reward History */}
      <div>
        <p className="acct-kicker mb-3">{copy.rewards.eyebrow}</p>
        {rewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={copy.rewards.emptyTitle}
            description={copy.rewards.emptyDescription}
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {rewards.map((reward: Record<string, string | number | null>) => {
              const status = String(reward.status || "held");
              return (
                <div
                  key={reward.id as string}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-surface)]">
                    <Gift size={18} className="text-[var(--acct-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">
                      {reward.reason
                        ? String(reward.reason).replace(/_/g, " ")
                        : copy.rewards.referralRewardFallback}
                    </p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {reward.created_at
                        ? formatDate(reward.created_at as string)
                        : ""}
                      {reward.paid_at
                        ? ` · ${formatAccountTemplate(copy.rewards.paidTemplate, {
                            date: formatDate(reward.paid_at as string),
                          })}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`acct-chip ${rewardChip[status] || "acct-chip-gold"}`}
                    >
                      {rewardStatusLabel[status] || status}
                    </span>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">
                      {formatNaira(reward.amount_kobo as number)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
