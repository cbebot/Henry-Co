import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getJobsCopy, type AppLocale, type JobsCopy } from "@henryco/i18n";

/**
 * V3 PASS 21 — VerificationBadge primitive.
 *
 * Renders the verified / pending / rejected state for a skill,
 * experience, reference, or KYC verification. Consumed by the
 * candidate ProfileBuilder and any /employer/applicants/[id] candidate
 * snapshot.
 *
 * Server-friendly — accepts a `locale` prop so server components can
 * resolve the right copy without hitting useHenryCoLocale().
 */
export type VerificationKind = "skill" | "experience" | "reference" | "kyc";
export type VerificationState =
  | "verified"
  | "pending"
  | "rejected"
  | "unverified";

type VerificationBadgeProps = {
  /**
   * Optional badge type for future surface-specific styling (icon swap
   * by kind). Reserved; not consumed today.
   */
  kind?: VerificationKind;
  state: VerificationState;
  locale: AppLocale;
  label?: string;
};

export function VerificationBadge({
  state,
  locale,
  label,
}: VerificationBadgeProps) {
  const copy: JobsCopy = getJobsCopy(locale);
  const labels = copy.verification;

  let icon: React.ReactNode;
  let stateLabel: string;
  let toneClass: string;
  switch (state) {
    case "verified":
      icon = <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />;
      stateLabel = labels.badgeVerified;
      toneClass =
        "bg-[var(--jobs-accent-soft)] text-[var(--jobs-accent)]";
      break;
    case "pending":
      icon = <Clock3 aria-hidden className="h-3.5 w-3.5" />;
      stateLabel = labels.badgePending;
      toneClass = "bg-amber-50 text-amber-700";
      break;
    case "rejected":
      icon = <XCircle aria-hidden className="h-3.5 w-3.5" />;
      stateLabel = labels.badgeRejected;
      toneClass = "bg-red-50 text-red-700";
      break;
    case "unverified":
    default:
      icon = <Clock3 aria-hidden className="h-3.5 w-3.5" />;
      stateLabel = labels.badgePending;
      toneClass = "bg-slate-100 text-slate-700";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      {icon}
      <span>{label ?? stateLabel}</span>
    </span>
  );
}
