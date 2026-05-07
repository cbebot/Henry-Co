import { Panel, Section } from "@henryco/dashboard-shell/components";
import { ArrowRight } from "lucide-react";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

/**
 * LifecycleContinueWidget — promotes the existing V2-LIFECYCLE
 * "continue where you left off" surface into a registered widget.
 * The full lifecycle snapshot rendering still lives at
 * `apps/account/components/lifecycle/LifecycleContinuePanel.tsx`
 * (consumed via /tasks). The widget here is a deep-linked entry
 * card; the in-flight panel surfaces inline on the home below the
 * Smart Home grid for richer behavior.
 *
 * Headline copy is data-driven only when a lifecycle snapshot exists
 * — otherwise the widget surfaces a calm "All caught up" state and
 * routes to the activity hub.
 */
export type LifecycleContinueWidgetProps = {
  /** Pre-fetched headline label from the lifecycle collector. */
  headline?: string | null;
  /** Pre-fetched destination href. */
  href?: string | null;
};

export function LifecycleContinueWidget({
  headline,
  href,
}: LifecycleContinueWidgetProps) {
  const targetHref = href ?? "/activity";
  const title = headline ?? "Continue where you left off";

  return (
    <Panel tone="flat">
      <Section kicker="Pick up" headline={title}>
        <a
          href={targetHref}
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
      </Section>
    </Panel>
  );
}
