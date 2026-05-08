import { ActionButton, EmptyState, Panel } from "@henryco/dashboard-shell";

/**
 * SmartHomeEmpty — typographic empty surface for the brand-new
 * viewer. Closes anti-pattern #16.
 *
 * Triggers when:
 *   - signal feed has 0 items
 *   - no module has emitted home widgets
 *   - lifecycle has 0 entries
 *
 * That is, this is the FIRST-RUN state — no cartoons, no "Coming
 * soon" decoration, no decorative tile grid. Just a calm typographic
 * teaching surface that points to a single next-best onboarding
 * action keyed by the highest-priority registered module.
 */
export type SmartHomeEmptyProps = {
  firstName: string | null;
  primaryAction: { label: string; href: string } | null;
  secondaryAction: { label: string; href: string } | null;
};

export function SmartHomeEmpty({ firstName, primaryAction, secondaryAction }: SmartHomeEmptyProps) {
  return (
    <Panel tone="raised">
      <EmptyState
        kicker={firstName ? `${firstName}, your dashboard wakes up as you use HenryCo` : "Welcome"}
        headline="Live signals will surface here as they land."
        body="Wallet activity, marketplace orders, support replies, lifecycle blockers — they all come into one ranked feed. Start with a small first move; the dashboard fills itself."
        align="start"
        action={
          primaryAction || secondaryAction ? (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {primaryAction ? (
                <ActionButton tone="primary" href={primaryAction.href}>
                  {primaryAction.label}
                </ActionButton>
              ) : null}
              {secondaryAction ? (
                <ActionButton tone="secondary" href={secondaryAction.href}>
                  {secondaryAction.label}
                </ActionButton>
              ) : null}
            </div>
          ) : null
        }
      />
    </Panel>
  );
}
