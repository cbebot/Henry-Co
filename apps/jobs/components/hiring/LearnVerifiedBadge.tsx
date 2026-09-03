import type { ReactNode } from "react";

/**
 * V3-56 — "Verified by Henry Onyx Learn" badge.
 *
 * Pure presentational mark for a `source='learn_completion'` skill verification.
 * Owns no copy and no logic: the caller supplies the already-translated `label`
 * (getLearnToEarnCopy(locale).badge.label) and an optional `verifyUrl` to the
 * public certificate ledger. Token-based teal tint (evokes the Learn accent),
 * `ring-inset` + fixed height → CLS ≈ 0, light + dark.
 */
function SealGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="7" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.1 7.1 7.4 8.4 10 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.7 10.6 4.6 14l3.4-1.8L11.4 14l-1.1-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LearnVerifiedBadge({
  label,
  verifyUrl,
  verifyLabel,
  ariaLabel,
  size = "md",
  className,
}: {
  /** Already-translated badge label, e.g. "Verified by Henry Onyx Learn". */
  label: string;
  /** Public certificate-ledger URL; when present the badge links to it. */
  verifyUrl?: string | null;
  /** Translated accessible name for the verify link. */
  verifyLabel?: string;
  /** Translated aria-label for the badge. */
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}): ReactNode {
  const sizeClass =
    size === "sm" ? "h-[22px] px-2 text-[11px] tracking-[0.04em]" : "h-[26px] px-2.5 text-xs tracking-[0.04em]";
  const tint =
    "bg-teal-600/10 text-teal-800 ring-1 ring-inset ring-teal-600/25 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-400/30";
  const base = `inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${sizeClass} ${tint}`;
  const merged = className ? `${base} ${className}` : base;

  const inner = (
    <span className={merged} aria-label={ariaLabel ?? label}>
      <SealGlyph />
      {label}
    </span>
  );

  if (verifyUrl) {
    return (
      <a
        href={verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex no-underline transition-opacity hover:opacity-80"
        aria-label={verifyLabel ?? ariaLabel ?? label}
      >
        {inner}
      </a>
    );
  }
  return inner;
}
