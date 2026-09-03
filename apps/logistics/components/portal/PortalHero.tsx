import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, MapPin } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

/**
 * PortalHero — editorial-premium hero for Henry Onyx Logistics public surfaces.
 *
 * Owner-validated pattern (feedback_no_giant_hero_text.md):
 *  - Hero ≠ giant headline; hero = capability evidence above the fold.
 *  - Serif display headline scaled for premium calm (≤ ~3rem), never full-viewport.
 *  - Capability strip below the headline carries the live numbers.
 *  - Token-only paint; no hex literals.
 */
export type PortalHeroCta = {
  href: string;
  label: string;
  variant: "primary" | "secondary" | "ghost";
  icon?: LucideIcon;
  external?: boolean;
};

type PortalHeroProps = {
  eyebrow: string;
  title: string;
  blurb: string;
  ctas: PortalHeroCta[];
  pickupHours?: string | null;
  coverage?: string | null;
  capabilityMetrics?: PortalCapabilityMetric[];
  locale?: AppLocale;
};

export type PortalCapabilityMetric = {
  label: string;
  value: string;
  /** Optional currency glyph rendered smaller, e.g. "$" or "₦". */
  currencyGlyph?: string;
  /** Required: trend OR comparison text — never bare numbers (anti-pattern #18). */
  trend: string;
  trendDirection?: "pos" | "neg" | "neutral";
  /** Optional "Active right now" pulsing dot on the lead tile. */
  pulse?: boolean;
  /** Highlights the first metric with the copper border. */
  emphasis?: boolean;
};

export function PortalHero(props: PortalHeroProps) {
  return (
    <section className="log-pf__hero" aria-labelledby="log-pf-hero-title">
      <div className="log-pf__hero-row">
        <div>
          <span className="log-pf__hero-eyebrow">
            <span className="log-pf__hero-eyebrow-dot" aria-hidden />
            {props.eyebrow}
          </span>
          <h1 id="log-pf-hero-title" className="log-pf__hero-title">
            {props.title}
          </h1>
          <p className="log-pf__hero-blurb">{props.blurb}</p>
          {props.coverage ? (
            <span className="log-pf__hero-coverage">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {props.coverage}
            </span>
          ) : null}
          <div className="log-pf__hero-ctas">
            {props.ctas.map((cta) => (
              <CtaLink key={cta.href + cta.label} cta={cta} />
            ))}
          </div>
          {props.pickupHours ? (
            <p className="log-pf__hero-pickup">{props.pickupHours}</p>
          ) : null}
        </div>
        {props.capabilityMetrics && props.capabilityMetrics.length > 0 ? (
          <PortalCapabilityStrip metrics={props.capabilityMetrics} locale={props.locale} />
        ) : null}
      </div>
    </section>
  );
}

function CtaLink({ cta }: { cta: PortalHeroCta }) {
  const Icon = cta.icon ?? ArrowRight;
  const cls =
    cta.variant === "primary"
      ? "log-pf__cta log-pf__cta-primary"
      : cta.variant === "secondary"
        ? "log-pf__cta log-pf__cta-secondary"
        : "log-pf__cta log-pf__cta-ghost";
  if (cta.external) {
    return (
      <a href={cta.href} className={cls} rel="noopener noreferrer" target="_blank">
        {cta.label}
        <Icon className="h-4 w-4" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={cta.href} className={cls}>
      {cta.label}
      <Icon className="h-4 w-4" aria-hidden />
    </Link>
  );
}

export function PortalCapabilityStrip({
  metrics,
  locale,
}: {
  metrics: PortalCapabilityMetric[];
  locale?: AppLocale;
}) {
  const t = (text: string) =>
    locale ? translateSurfaceLabel(locale, text) : text;
  // Cap visual density to 4 tiles. Anything past that lives in a section.
  const clipped = metrics.slice(0, 4);
  return (
    <div className="log-pf__capability" role="list" aria-label={t("Live capability evidence")}>
      {clipped.map((metric, i) => {
        const trendClass =
          metric.trendDirection === "pos"
            ? "log-pf__metric-trend-pos"
            : metric.trendDirection === "neg"
              ? "log-pf__metric-trend-neg"
              : "";
        return (
          <div
            key={metric.label + i}
            role="listitem"
            className={
              "log-pf__metric" + (metric.emphasis ? " log-pf__metric--copper" : "")
            }
          >
            <span className="log-pf__metric-label">{metric.label}</span>
            <span
              className={
                "log-pf__metric-value" +
                (typeof metric.value === "string" && /[a-zA-Z]{4}|\s/.test(metric.value)
                  ? " log-pf__metric-value--text"
                  : "")
              }
            >
              {metric.currencyGlyph ? (
                <span className="log-pf__metric-value-currency" aria-hidden>
                  {metric.currencyGlyph}
                </span>
              ) : null}
              {metric.value}
            </span>
            <span className={`log-pf__metric-trend ${trendClass}`.trim()}>
              {metric.pulse ? <span className="log-pf__pulse" aria-hidden /> : null}
              {metric.trend}
            </span>
          </div>
        );
      })}
    </div>
  );
}
