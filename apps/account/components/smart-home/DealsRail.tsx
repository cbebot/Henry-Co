import { Tag } from "lucide-react";
import { Panel, Section } from "@henryco/dashboard-shell";
import { CardTelemetry } from "@henryco/ui";
import type { DealOffer } from "@henryco/intelligence";
import {
  formatDealsTemplate,
  translateSurfaceLabel,
  type AppLocale,
  type DealsCopy,
} from "@henryco/i18n";
// Locale-aware date face (the root barrel's formatDate is the timezone one).
import { formatDate } from "@henryco/i18n/format-date";

/**
 * DealsRail — V3-35 server-rendered offers rail on the account Smart Home.
 *
 * Renders the OPAQUE `DealOffer` projection only: reason CODES (localized
 * here), never a score. Deal titles/descriptions are author-supplied free
 * text and pass through `translateSurfaceLabel`; all chrome comes from the
 * typed `surface:deals` copy module. Links are config-derived absolute URLs
 * (zero hardcoded domains). Tokens only — AA in both themes (accent chip is
 * dark-ink-on-soft-accent, mirroring the shipped NextBestActions pattern).
 */
export type DealsRailProps = {
  offers: ReadonlyArray<DealOffer>;
  copy: DealsCopy;
  locale: AppLocale;
};

function termsLabel(offer: DealOffer, copy: DealsCopy, locale: AppLocale): string {
  switch (offer.terms.kind) {
    case "percent_off":
      return formatDealsTemplate(copy.terms.percentOff, {
        percent: offer.terms.percent,
      });
    case "fixed_off": {
      let amount: string;
      try {
        amount = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: offer.terms.currency,
        }).format(offer.terms.amountMinor / 100);
      } catch {
        amount = `${offer.terms.amountMinor / 100} ${offer.terms.currency}`;
      }
      return formatDealsTemplate(copy.terms.amountOff, { amount });
    }
    case "bogo":
      return copy.terms.bogo;
    case "bundle":
      return copy.terms.bundle;
    case "spotlight":
      return copy.terms.spotlight;
  }
}

function reasonLabel(offer: DealOffer, copy: DealsCopy): string {
  switch (offer.reasonCodes[0]) {
    case "recent_division_activity":
      return copy.reasons.recentDivisionActivity;
    case "category_match":
      return copy.reasons.categoryMatch;
    case "ending_soon":
      return copy.reasons.endingSoon;
    case "new_this_week":
      return copy.reasons.newThisWeek;
    case "cross_division_offer":
      return copy.reasons.crossDivisionOffer;
    case "division_local":
    default:
      return copy.reasons.divisionLocal;
  }
}

export function DealsRail({ offers, copy, locale }: DealsRailProps) {
  if (offers.length === 0) return null;
  return (
    <Section kicker={copy.rail.kicker} headline={copy.rail.title}>
      <ul
        aria-label={copy.rail.listLabel}
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        }}
      >
        {offers.map((offer) => (
          <li key={offer.id}>
            <CardTelemetry
              cardId={`account.deal.${offer.id}`}
              classification="A"
              division={offer.division ?? "account"}
              target={offer.ctaHref}
            >
              <Panel tone="flat" padding="lg">
                <a
                  href={offer.ctaHref}
                  style={{
                    display: "block",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      paddingInline: "0.5rem",
                      paddingBlock: "0.2rem",
                      borderRadius: "999px",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      backgroundColor: "var(--hc-accent-soft)",
                      color: "var(--hc-accent-text, #8C6B0F)",
                    }}
                  >
                    <Tag size={11} aria-hidden />
                    {termsLabel(offer, copy, locale)}
                  </span>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      marginTop: "0.5rem",
                      marginBottom: "0.3rem",
                      color: "var(--acct-ink, #0F172A)",
                    }}
                  >
                    {translateSurfaceLabel(locale, offer.title)}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--acct-muted, #6B7280)",
                      margin: 0,
                      maxWidth: "44ch",
                    }}
                  >
                    {reasonLabel(offer, copy)}
                  </p>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      color: "var(--acct-muted, #6B7280)",
                      marginTop: "0.6rem",
                      marginBottom: 0,
                    }}
                  >
                    <span>
                      {formatDealsTemplate(copy.rail.endsOn, {
                        date: formatDate(offer.endsAt, { locale }),
                      })}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--acct-ink, #0F172A)",
                      }}
                    >
                      {copy.rail.view}
                    </span>
                  </p>
                </a>
              </Panel>
            </CardTelemetry>
          </li>
        ))}
      </ul>
    </Section>
  );
}
