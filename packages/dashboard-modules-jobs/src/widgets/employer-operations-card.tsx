import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Building2, ArrowRight } from "lucide-react";
import { JOBS_EMPLOYER_WORKSPACE_HREF, type EmployerSnapshot } from "../data";

/**
 * EmployerOperationsCard — the operator WINDOW into hiring
 * (dashboard-vs-workspaces decision, 2026-07-09).
 *
 * Surfaced only when `loadEmployerSnapshot` returns a live employer membership.
 * It states the viewer's standing (their employer, how many they run) and opens
 * the ONE next step: the real employer workspace on the jobs subdomain. It does
 * not re-implement hiring — the tool lives in the division; this is the record's
 * window into it. Cross-domain link (target=_blank) because /employer is served
 * by apps/jobs, not the account shell.
 */
export function EmployerOperationsCard({
  snapshot,
}: {
  snapshot: EmployerSnapshot;
}) {
  const { employerCount, primaryEmployerName } = snapshot;
  const headline = primaryEmployerName
    ? `Hiring at ${primaryEmployerName}`
    : "Your hiring operations";
  const description =
    employerCount > 1
      ? `You run hiring across ${employerCount} employers.`
      : "Post roles, review applicants, and move candidates through your pipeline.";

  return (
    <Panel tone="raised">
      <Section
        kicker="Employer"
        headline={headline}
        description={description}
        action={
          <ActionButton
            href={JOBS_EMPLOYER_WORKSPACE_HREF}
            target="_blank"
            tone="primary"
            icon={<Building2 size={14} />}
          >
            Open employer workspace
          </ActionButton>
        }
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: `var(${CSS_VARS.inkMuted})`,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          Jobs, applicants, and interviews live in your workspace
          <ArrowRight size={13} aria-hidden />
        </span>
      </Section>
    </Panel>
  );
}
