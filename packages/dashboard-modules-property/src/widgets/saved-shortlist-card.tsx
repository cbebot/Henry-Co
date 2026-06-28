import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Home, ArrowRight } from "lucide-react";
import { formatPropertyPrice, timeAgo } from "../format";
import { PROPERTY_SAVED_HREF, type PropertySnapshot } from "../data";

/**
 * SavedShortlistCard — surfaces the viewer's most recently saved
 * listings, deep-linked into the live `/property/saved` shortlist
 * surface (the same page the property landing's "saved shortlist" CTA
 * opens). Renders REAL listing titles, locations, and prices from the
 * snapshot; nothing is fabricated.
 *
 * Uses Next/Link for SPA-fast navigation (no full reload). Whole-naira
 * prices format via `formatPropertyPrice`, never a kobo formatter.
 */
export function SavedShortlistCard({ snapshot }: { snapshot: PropertySnapshot }) {
  const { saved, stats } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="Saved"
        headline={
          stats.saved > 0
            ? `${stats.saved} saved listing${stats.saved === 1 ? "" : "s"}`
            : "Save listings for later"
        }
        action={
          <ActionButton
            href={PROPERTY_SAVED_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open shortlist
          </ActionButton>
        }
      >
        {saved.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            Tap save on any listing to keep it on your shortlist across every device.
          </p>
        ) : (
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {saved.slice(0, 3).map((listing) => (
              <li key={listing.saveId}>
                <Link
                  href={PROPERTY_SAVED_HREF}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: `1px solid var(${CSS_VARS.hairline})`,
                    backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                    color: `var(${CSS_VARS.ink})`,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      minWidth: 0,
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
                      <Home size={16} />
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {listing.title}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: `var(${CSS_VARS.inkMuted})`,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {[listing.location || listing.district, `saved ${timeAgo(listing.savedAt)}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: `var(${CSS_VARS.accentText})`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatPropertyPrice(listing.price, listing.currency, listing.priceInterval)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Panel>
  );
}
