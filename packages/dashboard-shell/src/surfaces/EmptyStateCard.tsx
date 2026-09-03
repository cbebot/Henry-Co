/**
 * EmptyStateCard — the canonical empty state for inner pages.
 *
 * ACCOUNT-PREMIUM-01, Phase 2.
 *
 * Replaces every ad-hoc empty-state surface across the inner-shell.
 * Different from packages/dashboard-shell/components/EmptyState (which
 * is the inline typographic empty used by SmartHome and shell chrome):
 * EmptyStateCard is the SECTION-LEVEL empty — it sits inside a list
 * region and replaces what would have been the row stream.
 *
 * Voice: declarative, brand-coherent, names the missing thing + the
 * actionable next step. Per the spec — never "Nothing here yet." Always
 * "No bookings yet — when you book a service it appears here." with a
 * primary CTA when there's a clean next action.
 *
 * Composition: kicker → headline → body → CTA → optional illustration slot.
 *
 * Tones:
 *   - "page" (default): card surface, 28px inset padding.
 *   - "ghost"          : transparent surface, used inside cards / panels.
 *
 * I18N: all strings come through props. Zero hardcoded copy.
 */

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export type EmptyStateCardProps = {
  /** Optional all-caps kicker e.g. "Care · empty". */
  kicker?: string;
  /** Headline — short editorial sentence. */
  title: string;
  /** Body — 1-2 sentences. Names the missing thing + next action. */
  body?: string;
  /** Optional primary CTA. */
  cta?: {
    label: string;
    href: string;
    newTab?: boolean;
  };
  /** Optional illustration / icon slot — rendered above the title.
   *  Per design rule: NO friendly cartoon illustrations. Use a single
   *  glyph or compact data preview only. */
  slot?: ReactNode;
  /** Alignment — defaults to `start` (left-aligned). */
  align?: "start" | "center";
  /** Tone — `page` (card surface) or `ghost` (transparent, nested). */
  tone?: "page" | "ghost";
  /** Aria label override. */
  ariaLabel?: string;
};

function shouldOpenNewTab(href: string, override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  return /^https?:\/\//.test(href);
}

export function EmptyStateCard({
  kicker,
  title,
  body,
  cta,
  slot,
  align = "start",
  tone = "page",
  ariaLabel,
}: EmptyStateCardProps) {
  return (
    <div
      className="acct-empty-card"
      data-align={align}
      data-tone={tone}
      role="status"
      aria-label={ariaLabel ?? title}
      style={tone === "ghost" ? { background: "transparent", border: "none", padding: 0 } : undefined}
    >
      {slot ? <div className="acct-empty-card__slot">{slot}</div> : null}
      {kicker ? <p className="acct-empty-card__kicker">{kicker}</p> : null}
      <h3 className="acct-empty-card__title">{title}</h3>
      {body ? <p className="acct-empty-card__body">{body}</p> : null}
      {cta ? (
        <a
          className="acct-empty-card__cta"
          href={cta.href}
          {...(shouldOpenNewTab(cta.href, cta.newTab)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
        >
          {cta.label}
          <ArrowUpRight size={12} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
