/**
 * NextStepRow — the canonical "this is what you do next" row.
 *
 * ACCOUNT-PREMIUM-01, Phase 2.
 *
 * Sits directly under the HeroCard on every overview / division landing.
 * Single action; never a list of actions. If the user has more than one
 * thing to do, the picker that produced this row chose ONE — the rest
 * surface in the section below.
 *
 * Composition:
 *   [icon] [kicker / title / detail]  [cta]
 *
 * Tones:
 *   - "neutral"    — default; gentle gold-soft icon background.
 *   - "attention"  — warmer surround for "this needs you now".
 *   - "success"    — green icon; for "you're caught up — here's optional next".
 *
 * Surfaces the same row whether mobile (44+px touch CTA, wraps cleanly)
 * or desktop. The CTA pushes to the next surface; the whole row is
 * tappable when no CTA is provided (passive surfacing).
 *
 * I18N: all copy comes through props. Zero hardcoded strings.
 */

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export type NextStepRowProps = {
  /** All-caps kicker e.g. "Next step · payment". */
  kicker?: string;
  /** Headline / title line. */
  title: string;
  /** Optional detail line — 1-2 sentences. */
  detail?: string;
  /** Optional icon — a Lucide icon node or any ReactNode. */
  icon?: ReactNode;
  /** CTA. If omitted, the row is informational + the whole row links via `href`. */
  cta?: {
    label: string;
    href: string;
    /** Open in a new tab. Defaults to false for in-app routes, true for absolute URLs. */
    newTab?: boolean;
  };
  /** Optional whole-row href — used when no CTA is provided. */
  href?: string;
  /** Aria label override. Defaults to the title. */
  ariaLabel?: string;
  /** Tone — drives icon background and border emphasis. */
  tone?: "neutral" | "attention" | "success";
};

function shouldOpenNewTab(href: string, override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  return /^https?:\/\//.test(href);
}

export function NextStepRow({
  kicker,
  title,
  detail,
  icon,
  cta,
  href,
  ariaLabel,
  tone = "neutral",
}: NextStepRowProps) {
  const inner = (
    <>
      {icon ? (
        <span className="acct-next-step__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="acct-next-step__body">
        {kicker ? <p className="acct-next-step__kicker">{kicker}</p> : null}
        <p className="acct-next-step__title">{title}</p>
        {detail ? <p className="acct-next-step__detail">{detail}</p> : null}
      </div>
      {cta ? (
        <a
          className="acct-next-step__cta"
          href={cta.href}
          aria-label={cta.label}
          {...(shouldOpenNewTab(cta.href, cta.newTab)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
        >
          {cta.label}
          <ArrowUpRight size={12} aria-hidden />
        </a>
      ) : null}
    </>
  );

  if (href && !cta) {
    return (
      <a
        className="acct-next-step"
        data-tone={tone}
        href={href}
        aria-label={ariaLabel ?? title}
        {...(shouldOpenNewTab(href, undefined)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : null)}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="acct-next-step" data-tone={tone} aria-label={ariaLabel ?? title}>
      {inner}
    </div>
  );
}
