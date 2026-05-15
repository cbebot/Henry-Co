/**
 * Gamification surfaces — Streak chip, badge grid, progress meter.
 * Server-rendered (no client interactivity required).
 */

import { Award, Flame } from "lucide-react";

export type StreakChipProps = {
  current: number;
  longest: number;
  label: string;
  longestLabel: string;
};

export function StreakChip({ current, longest, label, longestLabel }: StreakChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-amber-300/8 px-3 py-1.5 text-xs">
      <Flame className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
      <span className="font-semibold text-[var(--learn-ink)]">
        {current} {label}
      </span>
      <span className="text-[var(--learn-ink-soft)]">
        · {longest} {longestLabel}
      </span>
    </div>
  );
}

export type BadgeAward = {
  id: string;
  name: string;
  description: string;
  awardedAt?: string | null;
  earned: boolean;
};

export function BadgeGrid({
  badges,
  earnedLabel,
  lockedLabel,
}: {
  badges: BadgeAward[];
  earnedLabel: string;
  lockedLabel: string;
}) {
  if (badges.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <li
          key={badge.id}
          className={`rounded-[1.2rem] border p-4 ${
            badge.earned
              ? "border-[var(--learn-copper)]/40 bg-[var(--learn-copper)]/8"
              : "border-[var(--learn-line)] bg-white/5 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Award
              className={`h-4 w-4 ${
                badge.earned ? "text-[var(--learn-copper)]" : "text-[var(--learn-ink-soft)]"
              }`}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-[var(--learn-ink)]">{badge.name}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--learn-ink-soft)]">
            {badge.description}
          </p>
          <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
            {badge.earned ? earnedLabel : lockedLabel}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ProgressMeter({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <p className="font-semibold text-[var(--learn-ink-soft)]">{label}</p>
        <p className="font-semibold text-[var(--learn-ink)]">{clamped}%</p>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--learn-line)]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[var(--learn-mint-soft)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
