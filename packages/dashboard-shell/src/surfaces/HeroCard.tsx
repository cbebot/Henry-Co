/**
 * HeroCard — the canonical inner-page hero for the customer dashboard.
 *
 * ACCOUNT-PREMIUM-01, Phase 2 (surface primitives).
 *
 * Replaces eight independent hero implementations (CareHero, MarketplaceHero,
 * JobsHero, StudioHero, LearnHero, PropertyHero, InvoicesHero, HeroBalance,
 * NotificationsHero, InboxHero, TasksHero, SecurityHero, IdentityHero,
 * SettingsHero, CalendarHero) with one composition contract.
 *
 * Composition (from top to bottom):
 *   1. eyebrow      — pulsing dot + division-tinted kicker text
 *   2. headline     — serif display (Iowan / Newsreader fallback), state-driven
 *   3. blurb        — 1-2 sentence sentence-case explanation
 *   4. ctas         — primary (filled gold) + optional secondary (ghost outline)
 *   5. tiles        — 0-4 metric tiles with label/value/foot (real numbers only)
 *   6. side panel   — kicker + title + body, optional breakdown rows (paired/solo)
 *
 * The host app owns all copy (i18n via @henryco/i18n); the primitive owns
 * geometry, motion, light/dark adaptation, and the breakpoint behavior.
 *
 * VARIANTS:
 *   - solo    — single-column hero (no side panel). Used by activity/notifications/inbox.
 *   - paired  — two-column hero with optional side panel. Default for division landings.
 *   - compact — short hero (no tiles, no side), used on detail pages or thin landings.
 *
 * STATE TONE:
 *   - calm      — gold accent, default
 *   - active    — emphasized eyebrow dot animation, in-flight metric tone
 *   - attention — warning gold-soft background tint, recommend a primary CTA
 *   - empty     — softer headline weight, primary CTA is "Get started"
 *
 * The primitive consumes THEME-01 semantic tokens via the `--hc-*` and
 * `--acct-*` CSS variables already mounted by the host's globals.css.
 * No hardcoded hex. Light + Dark mode swap automatically.
 *
 * MOBILE: 360px renders single-column; tiles stack 2x2; CTAs full-width.
 * Touch targets ≥44px (V3-09 enforced via .acct-hero__cta padding).
 *
 * I18N: every string is a prop. The primitive has zero hardcoded copy
 * except the `aria-hidden` decorative dot. Strict gate stays green.
 *
 * A11Y:
 *   - `<section aria-label>` from `labels.ariaLabel` so screen readers
 *     announce the hero as a landmark.
 *   - Tiles are role="list" + role="listitem" for assistive nav.
 *   - Reduced motion respected (eyebrow dot pulse drops to opacity-only).
 */

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export type HeroCardCta = {
  /** The visible label — comes through i18n, never hardcoded. */
  label: string;
  /** href — internal anchor (`#section-id`) or absolute URL. */
  href: string;
  /** Open in a new tab — defaults inferred (absolute href => new tab, anchor => same tab). */
  newTab?: boolean;
};

export type HeroCardTile = {
  /** All-caps kicker label. */
  label: string;
  /** The metric value — string so the caller can format kobo/currency/percent. */
  value: string | number;
  /** Optional sub-foot line. Empty/null hides the foot. */
  foot?: string | null;
  /** Optional tone hint — paints the value with the matching status color in dark mode. */
  tone?: "default" | "accent" | "active" | "warning";
  /**
   * Optional deep-link. When set, the tile becomes an interactive, focusable
   * link to a (usually pre-filtered) destination — e.g. an "Active projects"
   * tile linking to the projects list filtered to active — instead of a silent
   * read-out. Renders an <a> with a hover/focus "view" affordance; absolute
   * URLs open in a new tab, in-app routes navigate in place.
   */
  href?: string;
};

export type HeroCardBreakdownRow = {
  /** The breakdown name (e.g. "In flight"). */
  label: string;
  /** Count — never null; rows with count 0 should be filtered by the caller. */
  count: number;
  /** Dot color — must come from a CSS variable expression (e.g. `var(--acct-gold, #C9A227)`). */
  color: string;
};

export type HeroCardSide = {
  /** Eyebrow above side title. */
  kicker: string;
  /** Side-panel title (1 line). */
  title: string;
  /** Side-panel body (1-2 sentences). */
  body: string;
  /** Optional breakdown rows. Falsy/empty hides the breakdown block. */
  breakdown?: {
    /** Kicker above the rows. */
    label: string;
    /** Rows — caller filters zero-count rows. */
    rows: ReadonlyArray<HeroCardBreakdownRow>;
    /** Aria label for the breakdown list. */
    ariaLabel?: string;
  };
};

export type HeroCardProps = {
  /** Layout — solo / paired / compact. */
  variant?: "solo" | "paired" | "compact";
  /** State tone — drives background gradient + eyebrow dot. */
  tone?: "calm" | "active" | "attention" | "empty";
  /** Eyebrow text — short kicker (e.g. "Care · live"). */
  eyebrow: string;
  /** Headline — short editorial sentence (state-driven; i18n template resolved by caller). */
  headline: string;
  /** Blurb — 1-2 sentences explaining the headline. */
  blurb?: string;
  /** Aria label for the hero landmark. */
  ariaLabel?: string;
  /** Aria label for the tile list (default: derived). */
  ariaTilesLabel?: string;
  /** Primary CTA — filled. Optional (some thin pages render only headline + tiles). */
  ctaPrimary?: HeroCardCta;
  /** Secondary CTA — ghost outline. */
  ctaSecondary?: HeroCardCta;
  /** 0-4 tiles. Rendered as a responsive grid. */
  tiles?: ReadonlyArray<HeroCardTile>;
  /** Side panel — only rendered if variant === "paired". */
  side?: HeroCardSide;
  /** Optional progress strip below the tiles (0-100). When present, renders a slim bar. */
  progress?: {
    /** 0-100. */
    percent: number;
    /** Label, e.g. "Profile readiness · 64%". */
    label: string;
  };
  /** Optional rendered insertion below the tiles (above progress). For tilted media (calendar agenda micro-strip, etc.) */
  belowTiles?: ReactNode;
};

/**
 * Resolve newTab default: absolute URLs (http/https) open in a new tab;
 * in-page anchors (`#…`) stay in-tab. Callers can override via `newTab`.
 */
function resolveNewTab(href: string, override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  if (href.startsWith("#")) return false;
  return /^https?:\/\//.test(href);
}

export function HeroCard({
  variant = "paired",
  tone = "calm",
  eyebrow,
  headline,
  blurb,
  ariaLabel,
  ariaTilesLabel,
  ctaPrimary,
  ctaSecondary,
  tiles,
  side,
  progress,
  belowTiles,
}: HeroCardProps) {
  const hasTiles = Array.isArray(tiles) && tiles.length > 0;
  const hasSide = variant === "paired" && Boolean(side);
  const isCompact = variant === "compact";

  return (
    <section
      className="acct-hero"
      data-variant={variant}
      data-tone={tone}
      data-has-side={hasSide ? "true" : "false"}
      aria-label={ariaLabel ?? eyebrow}
    >
      <div className="acct-hero__inner">
        <div className="acct-hero__lead">
          <span className="acct-hero__eyebrow">
            <span className="acct-hero__eyebrow-dot" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="acct-hero__headline">{headline}</h1>
          {blurb ? <p className="acct-hero__blurb">{blurb}</p> : null}

          {(ctaPrimary || ctaSecondary) && !isCompact ? (
            <div className="acct-hero__ctas">
              {ctaPrimary ? (
                <a
                  className="acct-hero__cta acct-hero__cta--primary"
                  href={ctaPrimary.href}
                  {...(resolveNewTab(ctaPrimary.href, ctaPrimary.newTab)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : null)}
                >
                  {ctaPrimary.label}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              ) : null}
              {ctaSecondary ? (
                <a
                  className="acct-hero__cta acct-hero__cta--ghost"
                  href={ctaSecondary.href}
                  {...(resolveNewTab(ctaSecondary.href, ctaSecondary.newTab)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : null)}
                >
                  {ctaSecondary.label}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}

          {hasTiles && !isCompact ? (
            <div
              className="acct-hero__tiles"
              role="list"
              aria-label={ariaTilesLabel ?? eyebrow}
            >
              {tiles!.map((tile, i) => {
                const tone = tile.tone ?? "default";
                const key = `${tile.label}-${i}`;
                const body = (
                  <>
                    <span className="acct-hero__tile-label">{tile.label}</span>
                    <span className="acct-hero__tile-value">{tile.value}</span>
                    {tile.foot ? <span className="acct-hero__tile-foot">{tile.foot}</span> : null}
                  </>
                );
                if (tile.href) {
                  const newTab = resolveNewTab(tile.href, undefined);
                  return (
                    <a
                      className="acct-hero__tile acct-hero__tile--link"
                      role="listitem"
                      key={key}
                      data-tone={tone}
                      href={tile.href}
                      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : null)}
                    >
                      {body}
                      <ArrowUpRight className="acct-hero__tile-go" size={14} aria-hidden />
                    </a>
                  );
                }
                return (
                  <div className="acct-hero__tile" role="listitem" key={key} data-tone={tone}>
                    {body}
                  </div>
                );
              })}
            </div>
          ) : null}

          {belowTiles && !isCompact ? (
            <div className="acct-hero__below-tiles">{belowTiles}</div>
          ) : null}

          {progress && !isCompact ? (
            <div
              className="acct-hero__progress"
              role="progressbar"
              aria-label={progress.label}
              aria-valuenow={Math.max(0, Math.min(100, progress.percent))}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="acct-hero__progress-track">
                <div
                  className="acct-hero__progress-fill"
                  style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
                />
              </div>
              <span className="acct-hero__progress-label">{progress.label}</span>
            </div>
          ) : null}
        </div>

        {hasSide && side ? (
          <aside className="acct-hero__side" aria-label={side.kicker}>
            <p className="acct-hero__side-kicker">{side.kicker}</p>
            <p className="acct-hero__side-title">{side.title}</p>
            <p className="acct-hero__side-body">{side.body}</p>
            {side.breakdown && side.breakdown.rows.length > 0 ? (
              <div
                className="acct-hero__breakdown"
                aria-label={side.breakdown.ariaLabel ?? side.breakdown.label}
              >
                <p className="acct-hero__breakdown-label">{side.breakdown.label}</p>
                {side.breakdown.rows.map((row, i) => (
                  <div className="acct-hero__breakdown-row" key={`${row.label}-${i}`}>
                    <span className="acct-hero__breakdown-name">
                      <span
                        className="acct-hero__breakdown-dot"
                        style={{ background: row.color }}
                        aria-hidden
                      />
                      {row.label}
                    </span>
                    <span className="acct-hero__breakdown-count">{row.count}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
