import { Panel, Section } from "@henryco/dashboard-shell/components";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

/**
 * LifecycleContinueWidget — the honest "continue where you left off" card.
 *
 * SP6: the module now feeds it the REAL resume model (pending abandoned
 * tasks read live via `listUserAbandonedTasks` → `buildResumeModel`), so:
 *
 *   headline + href set  → the viewer's actual half-finished journey, one tap
 *                          from resuming (count > 1 routes to /continue).
 *   nothing pending      → a calm caught-up state (no fabricated urgency,
 *                          no dead "Resume" link — it points at /activity).
 *
 * Before SP6 the module always passed null/null, so the card claimed
 * "Continue where you left off" with no destination even when six pending
 * journeys existed. Every figure here is read, never fabricated.
 */
export type LifecycleContinueWidgetProps = {
  /** Real resume headline from the pending-task model; null = caught up. */
  headline?: string | null;
  /** Real destination (the task's continueUrl, or /continue for several). */
  href?: string | null;
  /** Real pending-journey count; drives the supporting line. */
  count?: number;
};

export function LifecycleContinueWidget({
  headline,
  href,
  count = 0,
}: LifecycleContinueWidgetProps) {
  const hasPending = Boolean(headline && href);

  if (!hasPending) {
    return (
      <Panel tone="flat">
        <Section kicker="Pick up" headline="All caught up">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: `var(${CSS_VARS.inkMuted})`,
              fontSize: "0.8125rem",
            }}
          >
            <CheckCircle2 size={14} aria-hidden />
            Nothing waiting on you right now.
          </span>
        </Section>
      </Panel>
    );
  }

  return (
    <Panel tone="raised">
      <Section kicker="Pick up" headline={headline as string}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {count > 1 ? (
            <span
              style={{
                color: `var(${CSS_VARS.inkMuted})`,
                fontSize: "0.8125rem",
              }}
            >
              {count} journeys are waiting — the freshest is first.
            </span>
          ) : null}
          <a
            href={href as string}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: `var(${CSS_VARS.accentText})`,
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Resume <ArrowRight size={14} aria-hidden />
          </a>
        </div>
      </Section>
    </Panel>
  );
}
