"use client";

/**
 * Earn-With-Us Engine — `<EarnWithUs>` (doctrine Engine 6).
 *
 * A small, persistent, non-disruptive surface for the END of relevant
 * pages: the invitation + ONE line of real, server-computed proof. Click
 * leads to the role's onboarding microsite, never a generic signup.
 * Renders nothing for users already enrolled (tested predicate).
 */

import { ArrowRight } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { shouldShowInvite } from "./earn.logic";

export interface EarnWithUsLabels {
  /** The invitation, e.g. "Are you a verified caregiver?". */
  invitation: string;
  /** The REAL proof line, server-computed upstream and localized, e.g.
   *  "Verified providers earned an average of ₦120,000 last month". */
  proof: string;
  /** Link label, e.g. "Start earning". */
  action: string;
}

export interface EarnWithUsProps {
  role: string;
  enrolledRoles: string[];
  labels: EarnWithUsLabels;
  /** The role-specific onboarding microsite URL (not a generic signup). */
  onboardingHref: string;
  className?: string;
}

export function EarnWithUs({ role, enrolledRoles, labels, onboardingHref, className }: EarnWithUsProps) {
  if (!shouldShowInvite(role, enrolledRoles)) return null;

  return (
    <aside
      className={cn(
        "flex flex-col gap-2 rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/60 p-5",
        "dark:border-white/8 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{labels.invitation}</p>
        <p className="mt-0.5 text-sm leading-6 text-zinc-500 dark:text-white/55">{labels.proof}</p>
      </div>
      <a
        href={onboardingHref}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-full px-5 text-sm font-semibold outline-none sm:self-auto",
          "text-[color:var(--site-accent,#C9A227)] hover:brightness-110",
          "focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2",
        )}
      >
        {labels.action}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </aside>
  );
}
