import { Users, Gift, Clock, CheckCircle, XCircle } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import {
  getUserReferralCode,
  getUserReferrals,
  getReferralRewards,
  getReferralStats,
} from "@/lib/referral-data";
import { formatNaira, formatDate } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import CopyReferralCode from "@/components/referral/CopyReferralCode";

export const dynamic = "force-dynamic";

const statusChip: Record<string, string> = {
  pending: "acct-chip-orange",
  converted: "acct-chip-green",
  expired: "acct-chip-red",
};
const rewardChip: Record<string, string> = {
  pending: "acct-chip-orange",
  paid: "acct-chip-green",
  cancelled: "acct-chip-red",
};
const statusIcon: Record<string, typeof Clock> = {
  pending: Clock,
  converted: CheckCircle,
  expired: XCircle,
};

export default async function ReferralsPage() {
  const user = await requireAccountUser();
  const [code, referrals, rewards, stats] = await Promise.all([
    getUserReferralCode(user.id),
    getUserReferrals(user.id),
    getReferralRewards(user.id),
    getReferralStats(user.id),
  ]);

  const referralsWithReferee = referrals.filter(
    (r: Record<string, unknown>) => r.referee_id != null
  );

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Referrals"
        description="Invite qualified customers to HenryCo and track rewards through pending, reviewed, and credited states."
        icon={Users}
      />

      {/* Referral Code Card */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">Your Referral Code</p>
        <CopyReferralCode code={code} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            Total Referred
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--acct-ink)]">
            {stats.totalReferred}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            Converted
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--acct-ink)]">
            {stats.converted}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            Pending Rewards
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--acct-gold)]">
            {formatNaira(stats.pendingRewards)}
          </p>
        </div>
        <div className="acct-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
            Earned Rewards
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatNaira(stats.paidRewards)}
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">How It Works</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-bold text-[var(--acct-gold)]">
              1
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              Share your code
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              Copy your unique referral code or link and share it with friends, family, or colleagues.
            </p>
          </div>
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-bold text-[var(--acct-gold)]">
              2
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              They sign up
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              We track the referred account only once. Self-referrals, duplicate households, and recycled signups do not qualify.
            </p>
          </div>
          <div className="rounded-xl bg-[var(--acct-surface)] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)] text-sm font-bold text-[var(--acct-gold)]">
              3
            </div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">
              Rewards clear after qualification
            </p>
            <p className="mt-1 text-xs text-[var(--acct-muted)]">
              Rewards are only credited after a qualifying transaction clears verification and abuse review. Pending rewards are not spendable.
            </p>
          </div>
        </div>
      </div>

      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">Referral Policy</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "A qualifying conversion means the referred account completed an eligible HenryCo action that passed payment and trust verification.",
            "HenryCo can hold, reverse, or cancel rewards for self-referrals, duplicate conversion loops, reversals, refunds, or suspicious reward patterns.",
            "Your dashboard shows referral matches and reward history separately so tracked signups are not mistaken for credited wallet earnings.",
          ].map((item) => (
            <div key={item} className="rounded-xl bg-[var(--acct-surface)] p-4 text-sm leading-7 text-[var(--acct-muted)]">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <div>
        <p className="acct-kicker mb-3">Your Referrals</p>
        {referralsWithReferee.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No referrals yet"
            description="Share your referral code to start inviting people. Referrals will appear here once someone signs up with your link."
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {referralsWithReferee.map(
              (referral: Record<string, string | number>) => {
                const status = String(referral.status || "pending");
                const StatusIcon = statusIcon[status] || Clock;
                return (
                  <div
                    key={referral.id as string}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-surface)]">
                      <StatusIcon
                        size={18}
                        className="text-[var(--acct-muted)]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        Referral {referral.referral_code}
                      </p>
                      <p className="text-xs text-[var(--acct-muted)]">
                        {referral.created_at
                          ? formatDate(referral.created_at as string)
                          : ""}
                        {referral.converted_at
                          ? ` · Converted ${formatDate(referral.converted_at as string)}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`acct-chip ${statusChip[status] || "acct-chip-gold"}`}
                    >
                      {status}
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
        <p className="acct-kicker mb-3">Reward History</p>
        {rewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No rewards yet"
            description="Credited rewards will appear here after qualifying conversions clear verification and anti-abuse review."
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {rewards.map((reward: Record<string, string | number>) => {
              const status = String(reward.status || "pending");
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
                      {reward.description || "Referral Reward"}
                    </p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {reward.created_at
                        ? formatDate(reward.created_at as string)
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`acct-chip ${rewardChip[status] || "acct-chip-gold"}`}
                    >
                      {status}
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
