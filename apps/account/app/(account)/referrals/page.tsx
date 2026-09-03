import { Users, Gift, Clock, CheckCircle, XCircle, ShieldAlert, Sparkles } from "lucide-react";
import { getAccountCopy, formatAccountTemplate } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  MetricStrip,
  TimelineCard,
  TimelineRow,
  DivisionLanding,
  type HeroCardTile,
  type MetricStripCell,
  type TimelineChip,
  type TimelineChipTone,
} from "@henryco/dashboard-shell/surfaces";

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
import CopyReferralCode from "@/components/referral/CopyReferralCode";

export const dynamic = "force-dynamic";

function statusTone(status: string): TimelineChipTone {
  switch (status) {
    case "qualified":
      return "success";
    case "converted":
      return "warning";
    case "flagged":
    case "expired":
      return "danger";
    case "pending":
    default:
      return "gold";
  }
}

function rewardTone(status: string): TimelineChipTone {
  switch (status) {
    case "released":
    case "paid":
      return "success";
    case "held":
    case "pending":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "gold";
  }
}

const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock,
  converted: Sparkles,
  qualified: CheckCircle,
  flagged: ShieldAlert,
  expired: XCircle,
};

/**
 * Referrals landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2E). The biggest consolidation
 * pass: HeroCard variant="paired" with referral code in the side panel +
 * MetricStrip for the 6-stat row (replacing two 4-col grids), TimelineCard
 * rows for both referrals + rewards (dropping hardcoded statusChip /
 * rewardChip color maps). How-It-Works and Policy preserved.
 */
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
    (r: Record<string, unknown>) => r.referee_id != null || r.status === "flagged",
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

  // ── Hero tiles + MetricStrip ─────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.stats.totalReferred,
      value: stats.totalReferred,
      foot: stats.totalReferred > 0 ? copy.hero.description : undefined,
      tone: stats.totalReferred > 0 ? "active" : "default",
    },
    {
      label: copy.stats.signedUp,
      value: stats.converted,
      tone: stats.converted > 0 ? "accent" : "default",
    },
    {
      label: copy.stats.qualified,
      value: stats.qualified,
      tone: stats.qualified > 0 ? "accent" : "default",
    },
    {
      label: copy.stats.flagged,
      value: stats.flagged,
      tone: stats.flagged > 0 ? "warning" : "default",
    },
  ];

  const metricCells: ReadonlyArray<MetricStripCell> = [
    {
      label: copy.stats.pendingRewards,
      value: formatNaira(stats.pendingRewards),
      tone: stats.pendingRewards > 0 ? "warning" : "default",
    },
    {
      label: copy.stats.releasedRewards,
      value: formatNaira(stats.paidRewards),
      tone: stats.paidRewards > 0 ? "success" : "default",
    },
  ];

  const heroTone: "calm" | "active" | "attention" | "empty" =
    stats.totalReferred === 0
      ? "empty"
      : stats.flagged > 0
        ? "attention"
        : stats.qualified > 0 || stats.converted > 0
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.code.eyebrow}
          headline={copy.hero.title}
          blurb={copy.hero.description}
          tiles={tiles}
          side={{
            kicker: copy.code.eyebrow,
            title: copy.code.eyebrow,
            body: formatAccountTemplate(copy.code.rewardNote, {
              amount: rewardAmount,
              days: REFERRAL_QUALIFY_HOLD_DAYS,
            }),
          }}
        />
      }
      metrics={
        <MetricStrip cells={metricCells} ariaLabel={copy.rewards.eyebrow} />
      }
      sections={[
        {
          id: "referrals-code",
          title: copy.code.eyebrow,
          meta: rewardAmount,
          content: (
            <div className="acct-card p-5">
              <CopyReferralCode code={code} copy={copy.code} />
              <p className="mt-3 text-xs text-[var(--acct-muted)]">
                {formatAccountTemplate(copy.code.rewardNote, {
                  amount: rewardAmount,
                  days: REFERRAL_QUALIFY_HOLD_DAYS,
                })}
              </p>
            </div>
          ),
        },
        {
          id: "referrals-how",
          title: copy.howItWorks.eyebrow,
          meta: copy.howItWorks.step3Title,
          content: (
            <div className="acct-card p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-[var(--acct-surface)] p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-semibold text-[var(--acct-gold)]">
                    1
                  </div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {copy.howItWorks.step1Title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {copy.howItWorks.step1Body}
                  </p>
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
                    {formatAccountTemplate(copy.howItWorks.step3Body, {
                      amount: rewardAmount,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "referrals-policy",
          title: copy.policy.eyebrow,
          meta: copy.policy.qualifying,
          content: (
            <div className="acct-card p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[copy.policy.qualifying, copy.policy.enforcement, copy.policy.separation].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-[var(--acct-surface)] p-4 text-sm leading-7 text-[var(--acct-muted)]"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          ),
        },
        {
          id: "referrals-list",
          title: copy.referralsList.eyebrow,
          meta: `${referralsWithReferee.length}`,
          content:
            referralsWithReferee.length === 0 ? (
              <EmptyStateCard
                kicker={copy.referralsList.eyebrow}
                title={copy.referralsList.emptyTitle}
                body={copy.referralsList.emptyDescription}
              />
            ) : (
              <TimelineCard ariaLabel={copy.referralsList.eyebrow}>
                {referralsWithReferee.map(
                  (referral: Record<string, string | number | null>) => {
                    const status = String(referral.status || "pending");
                    const StatusIcon = STATUS_ICON[status] || Clock;
                    const label = statusLabel[status] || status;
                    const flagReason = referral.flag_reason
                      ? flagReasonLabel[String(referral.flag_reason)] ||
                        String(referral.flag_reason)
                      : null;
                    const chips: TimelineChip[] = [
                      { label, tone: statusTone(status) },
                    ];
                    const detailParts: string[] = [];
                    if (referral.converted_at) {
                      detailParts.push(
                        formatAccountTemplate(copy.referralsList.signedUpTemplate, {
                          date: formatDate(referral.converted_at as string),
                        }),
                      );
                    }
                    if (referral.qualified_at) {
                      detailParts.push(
                        formatAccountTemplate(copy.referralsList.qualifiedTemplate, {
                          date: formatDate(referral.qualified_at as string),
                        }),
                      );
                    }
                    if (flagReason) detailParts.push(flagReason);
                    return (
                      <TimelineRow
                        key={referral.id as string}
                        avatar={<StatusIcon size={16} aria-hidden />}
                        title={
                          referral.referee_email
                            ? String(referral.referee_email)
                            : copy.referralsList.refereeFallback
                        }
                        detail={detailParts.join(" · ") || undefined}
                        chips={chips}
                        time={
                          referral.created_at
                            ? formatDate(referral.created_at as string)
                            : undefined
                        }
                      />
                    );
                  },
                )}
              </TimelineCard>
            ),
        },
        {
          id: "referrals-rewards",
          title: copy.rewards.eyebrow,
          meta: `${rewards.length}`,
          content:
            rewards.length === 0 ? (
              <EmptyStateCard
                kicker={copy.rewards.eyebrow}
                title={copy.rewards.emptyTitle}
                body={copy.rewards.emptyDescription}
              />
            ) : (
              <TimelineCard ariaLabel={copy.rewards.eyebrow}>
                {rewards.map(
                  (reward: Record<string, string | number | null>) => {
                    const status = String(reward.status || "held");
                    const chips: TimelineChip[] = [
                      {
                        label: rewardStatusLabel[status] || status,
                        tone: rewardTone(status),
                      },
                    ];
                    const detail = reward.paid_at
                      ? formatAccountTemplate(copy.rewards.paidTemplate, {
                          date: formatDate(reward.paid_at as string),
                        })
                      : undefined;
                    return (
                      <TimelineRow
                        key={reward.id as string}
                        avatar={<Gift size={16} aria-hidden />}
                        title={
                          reward.reason
                            ? String(reward.reason).replace(/_/g, " ")
                            : copy.rewards.referralRewardFallback
                        }
                        detail={detail}
                        chips={chips}
                        time={
                          reward.created_at
                            ? formatDate(reward.created_at as string)
                            : undefined
                        }
                        trailing={
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {formatNaira(reward.amount_kobo as number)}
                          </span>
                        }
                      />
                    );
                  },
                )}
              </TimelineCard>
            ),
        },
      ]}
      footer={
        <p
          style={{
            fontSize: 11,
            color: "var(--acct-muted)",
            textAlign: "center",
            margin: "8px 0 0",
          }}
        >
          <Users size={12} aria-hidden style={{ verticalAlign: "middle" }} />
        </p>
      }
    />
  );
}
