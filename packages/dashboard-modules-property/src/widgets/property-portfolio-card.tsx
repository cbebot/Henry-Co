import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { ArrowRight } from "lucide-react";
import { PROPERTY_HOME_HREF, type PropertySnapshot } from "../data";

/**
 * PropertyPortfolioCard — the property module's headline widget. Renders
 * the viewer's REAL aggregate across the four property tiles (saved /
 * inquiries / viewings / listings), the same numbers the `/property`
 * landing hero shows. Deep-links to `/property`.
 *
 * Empty state: typographic minimalism — honest zeros plus a single
 * sentence inviting the viewer to start a shortlist; no cartoon, no
 * exclamation.
 */
type Tile = {
  label: string;
  value: number;
  foot: string;
};

export function PropertyPortfolioCard({ snapshot }: { snapshot: PropertySnapshot }) {
  const { stats, hero } = snapshot;

  const headline =
    hero === "empty"
      ? "Start your property shortlist"
      : hero === "active"
        ? stats.viewings > 0
          ? `${stats.viewings} viewing${stats.viewings === 1 ? "" : "s"} in motion`
          : `${stats.inquiries} inquir${stats.inquiries === 1 ? "y" : "ies"} in progress`
        : `${stats.saved} saved listing${stats.saved === 1 ? "" : "s"}`;

  const tiles: ReadonlyArray<Tile> = [
    {
      label: "Saved",
      value: stats.saved,
      foot:
        stats.saved === 0
          ? "Nothing saved yet"
          : stats.managed > 0
            ? `${stats.managed} managed by Henry & Co.`
            : "On your shortlist",
    },
    {
      label: "Inquiries",
      value: stats.inquiries,
      foot: stats.inquiries === 0 ? "None sent" : "Awaiting a reply",
    },
    {
      label: "Viewings",
      value: stats.viewings,
      foot: stats.viewings === 0 ? "None requested" : "Requested",
    },
    {
      label: "Listings",
      value: stats.listings,
      foot: stats.listings === 0 ? "None submitted" : "Submitted by you",
    },
  ];

  return (
    <Panel tone="raised">
      <Section
        kicker="Property"
        headline={headline}
        action={
          <ActionButton
            href={PROPERTY_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Property
          </ActionButton>
        }
      >
        {stats.total === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            Save a listing, send an inquiry, or request a viewing and it shows up here.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(7rem, 1fr))",
            }}
          >
            {tiles.map((tile) => (
              <li
                key={tile.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid var(${CSS_VARS.hairline})`,
                  backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: `var(${CSS_VARS.inkMuted})`,
                  }}
                >
                  {tile.label}
                </span>
                <span
                  className="hc-metric-value"
                  style={{
                    fontFamily:
                      'var(--acct-font-display, "Iowan Old Style", "Baskerville", "Palatino Linotype", "Times New Roman", serif)',
                    fontWeight: 500,
                    fontSize: "1.75rem",
                    lineHeight: 1.05,
                    fontFeatureSettings: '"lnum" 0, "onum" 1, "kern" 1',
                    fontVariantNumeric: "oldstyle-nums tabular-nums",
                    color: `var(${CSS_VARS.ink})`,
                  }}
                >
                  {tile.value}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: `var(${CSS_VARS.inkSoft})`,
                  }}
                >
                  {tile.foot}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Panel>
  );
}
