import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { ArrowRight } from "lucide-react";
import { formatRating, formatRecord } from "../format";
import type { PlayProfileView } from "../data";

/**
 * ArenaStatsCard — the viewer's ranked profile. Renders ONLY when the
 * arena is enabled and the viewer has a `gaming_profiles` row (real
 * `rating` / `wins` / `losses` / `ties` from `getPlayModuleData`'s data
 * path). Never shown with fabricated numbers — the module manifest gates
 * this widget behind `hasRankedContent`.
 */
export function ArenaStatsCard({ profile }: { profile: PlayProfileView }) {
  const tiles: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Rating", value: formatRating(profile.rating) },
    { label: "Wins", value: String(profile.wins) },
    {
      label: "W / L / T",
      value: formatRecord(profile.wins, profile.losses, profile.ties),
    },
  ];

  return (
    <Panel tone="raised">
      <Section
        kicker="Your record"
        headline={profile.handle}
        action={
          <ActionButton
            href="/play"
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open arena
          </ActionButton>
        }
      >
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "0.5rem",
            margin: 0,
          }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.label}
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid var(${CSS_VARS.hairline})`,
                backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
              }}
            >
              <dt
                style={{
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: `var(${CSS_VARS.inkMuted})`,
                  margin: 0,
                }}
              >
                {tile.label}
              </dt>
              <dd
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: `var(${CSS_VARS.ink})`,
                  margin: "0.25rem 0 0",
                }}
              >
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </Panel>
  );
}
