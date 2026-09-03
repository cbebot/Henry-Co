import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { ArrowRight, Sparkles } from "lucide-react";

import { CARE_HOME_HREF, type CareSnapshot } from "../data";
import { timeAgo, titleCaseStatus } from "../format";

/**
 * BookingsOverviewCard — the care module's headline widget.
 *
 * Surfaces the viewer's real booking aggregate (total + in-flight /
 * scheduled / completed breakdown from `careStats`) and, when present,
 * the most recent care activity row. Every figure is loaded per-viewer;
 * nothing is fabricated. Empty state is typographic, not a cartoon.
 *
 * Tapping the card (or "Open Fabric Care") deep-links to the live
 * `/care` surface.
 */
export function BookingsOverviewCard({ snapshot }: { snapshot: CareSnapshot }) {
  const care = getDivisionConfig("care");
  const { stats, recentActivity } = snapshot;
  const latest = recentActivity[0] ?? null;

  const breakdown: ReadonlyArray<{ label: string; value: number }> = [
    { label: "In flight", value: stats.inFlight },
    { label: "Scheduled", value: stats.scheduled },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <Panel tone="raised">
      <Section
        kicker={care.shortName}
        headline={
          stats.total === 0
            ? "No bookings yet"
            : `${stats.total} booking${stats.total === 1 ? "" : "s"}`
        }
        description={
          stats.total === 0
            ? "Book garment care or cleaning and every pickup, payment, and delivery lands here."
            : "Your services in flight — payments due, scheduled visits, and completed jobs."
        }
        action={
          <ActionButton
            href={CARE_HOME_HREF}
            tone="primary"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Fabric Care
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
            When you book a service, it shows up here with live status.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.5rem",
                margin: 0,
              }}
            >
              {breakdown.map((item) => (
                <Link
                  key={item.label}
                  href={CARE_HOME_HREF}
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
                    {item.label}
                  </dt>
                  <dd
                    className="hc-metric-value"
                    style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      lineHeight: 1.1,
                      fontVariantNumeric: "tabular-nums",
                      color:
                        item.label === "In flight" && item.value > 0
                          ? care.accentText
                          : `var(${CSS_VARS.ink})`,
                    }}
                  >
                    {item.value}
                  </dd>
                </Link>
              ))}
            </dl>

            {latest ? (
              <Link
                href={latest.actionUrl || CARE_HOME_HREF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 0.75rem",
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
                    color: care.accentText,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: `var(${CSS_VARS.accentSoft})`,
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={14} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {latest.title || titleCaseStatus(latest.activityType) || "Care update"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: `var(${CSS_VARS.inkMuted})`,
                    }}
                  >
                    {titleCaseStatus(latest.status)} · {timeAgo(latest.occurredAt)}
                  </span>
                </span>
              </Link>
            ) : null}
          </div>
        )}
      </Section>
    </Panel>
  );
}
