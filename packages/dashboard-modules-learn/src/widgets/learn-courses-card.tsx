import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { ArrowRight, Sparkles } from "lucide-react";

import { LEARN_HOME_HREF, type LearnSnapshot } from "../data";
import { timeAgo, titleCaseStatus } from "../format";

/**
 * LearnCoursesCard — the learn module's headline widget.
 *
 * Surfaces the viewer's real enrollment aggregate (active / completed
 * from `learnStats`) and, when present, the most recent learn activity
 * row. Every figure is loaded per-viewer through `loadLearnSnapshot`;
 * nothing is fabricated. Empty state is typographic, not a cartoon.
 *
 * Tapping the card (or "Open Academy") deep-links to the live `/learn`
 * surface.
 */
export function LearnCoursesCard({ snapshot }: { snapshot: LearnSnapshot }) {
  const learn = getDivisionConfig("learn");
  const { stats, recentActivity } = snapshot;
  const { activeCourses, completedCourses } = stats.metrics;
  const latest = recentActivity[0] ?? null;

  const breakdown: ReadonlyArray<{ label: string; value: number; accent: boolean }> = [
    { label: "Active", value: activeCourses, accent: activeCourses > 0 },
    { label: "Completed", value: completedCourses, accent: false },
  ];

  return (
    <Panel tone="raised">
      <Section
        kicker={learn.shortName}
        headline={
          activeCourses > 0
            ? `${activeCourses} course${activeCourses === 1 ? "" : "s"} in progress`
            : completedCourses > 0
              ? `${completedCourses} course${completedCourses === 1 ? "" : "s"} completed`
              : "No courses yet"
        }
        description={
          stats.hasAnyEnrollment
            ? "Pick up where you left off — lessons, quizzes, and certificates sync from the Academy."
            : "Enroll in a course and every lesson, quiz, and certificate lands here automatically."
        }
        action={
          <ActionButton
            href={LEARN_HOME_HREF}
            tone="primary"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Academy
          </ActionButton>
        }
      >
        {!stats.hasAnyEnrollment ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            When you start a course, it shows up here with your progress.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.5rem",
                margin: 0,
              }}
            >
              {breakdown.map((item) => (
                <Link
                  key={item.label}
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
                      color: item.accent ? learn.accentText : `var(${CSS_VARS.ink})`,
                    }}
                  >
                    {item.value}
                  </dd>
                </Link>
              ))}
            </dl>

            {latest ? (
              <Link
                href={latest.actionUrl || LEARN_HOME_HREF}
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
                    color: learn.accentText,
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
                    {latest.title || titleCaseStatus(latest.activityType) || "Learning update"}
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
