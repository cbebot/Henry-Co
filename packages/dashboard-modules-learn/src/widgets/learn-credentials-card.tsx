import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { ArrowRight } from "lucide-react";

import { LEARN_HOME_HREF, type LearnSnapshot } from "../data";

/**
 * LearnCredentialsCard — surfaces the viewer's real credential and
 * assigned-learning aggregate (certificates, assigned items, saved
 * courses) from `loadLearnSnapshot`. Every figure is per-viewer; nothing
 * is fabricated. When all three are zero, a typographic empty state shows
 * instead of placeholder rows.
 *
 * Tapping any tile (or "Open Academy") deep-links to the live `/learn`
 * surface.
 */
export function LearnCredentialsCard({ snapshot }: { snapshot: LearnSnapshot }) {
  const learn = getDivisionConfig("learn");
  const { certificates, assignedLearning, savedCourses } = snapshot.stats.metrics;
  const hasAny = certificates + assignedLearning + savedCourses > 0;

  const tiles: ReadonlyArray<{ label: string; value: number; accent: boolean }> = [
    { label: "Certificates", value: certificates, accent: certificates > 0 },
    { label: "Assigned", value: assignedLearning, accent: assignedLearning > 0 },
    { label: "Saved", value: savedCourses, accent: false },
  ];

  return (
    <Panel tone="raised">
      <Section
        kicker={learn.shortName}
        headline={hasAny ? "Credentials & assigned" : "No credentials yet"}
        description={
          hasAny
            ? "Certificates you have earned, learning assigned to you, and courses you saved for later."
            : "Earn certificates, receive assigned learning, and save courses — they all collect here."
        }
        action={
          <ActionButton
            href={LEARN_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Academy
          </ActionButton>
        }
      >
        {!hasAny ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            Complete a certified course or get assigned training and it appears here.
          </p>
        ) : (
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "0.5rem",
              margin: 0,
            }}
          >
            {tiles.map((tile) => (
              <Link
                key={tile.label}
                href={LEARN_HOME_HREF}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid var(${CSS_VARS.hairline})`,
                  backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                  color: `var(${CSS_VARS.ink})`,
                  textDecoration: "none",
                }}
              >
                <dt
                  style={{
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: `var(${CSS_VARS.inkMuted})`,
                  }}
                >
                  {tile.label}
                </dt>
                <dd
                  className="hc-metric-value"
                  style={{
                    margin: 0,
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                    color: tile.accent ? learn.accentText : `var(${CSS_VARS.ink})`,
                  }}
                >
                  {tile.value}
                </dd>
              </Link>
            ))}
          </dl>
        )}
      </Section>
    </Panel>
  );
}
