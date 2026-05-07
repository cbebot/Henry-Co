import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Sparkles, ArrowRight } from "lucide-react";
import type { MarketplaceSnapshot } from "../data";

/**
 * DealsOfTheMomentCard — surfaces the curated `marketplace_deals_curation`
 * rows. Real-data-only — when no curation rows are active, the widget
 * renders an empty teaching state instead of fabricating placeholder
 * deals (anti-pattern #4).
 */
export function DealsOfTheMomentCard({
  snapshot,
}: {
  snapshot: MarketplaceSnapshot;
}) {
  const { curatedDeals } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="Deals of the moment"
        headline={
          curatedDeals.length > 0
            ? "Curated picks live now"
            : "No active deals"
        }
        action={
          <ActionButton
            href="/marketplace"
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open marketplace
          </ActionButton>
        }
      >
        {curatedDeals.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            When curators publish a deal slot, it appears here in real time.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
            }}
          >
            {curatedDeals.slice(0, 4).map((deal) => (
              <li key={deal.id}>
                <a
                  href={`/marketplace/product/${deal.productSlug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.75rem",
                    border: `1px solid var(${CSS_VARS.hairline})`,
                    backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                    color: `var(${CSS_VARS.ink})`,
                    textDecoration: "none",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: `var(${CSS_VARS.accentText})`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "0.5rem",
                      backgroundColor: `var(${CSS_VARS.accentSoft})`,
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={16} />
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {deal.productSlug.replace(/-/g, " ")}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: `var(${CSS_VARS.inkMuted})`,
                        textTransform: "capitalize",
                      }}
                    >
                      {deal.slot.replace(/_/g, " ")}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Panel>
  );
}
