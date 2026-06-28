import type { ReactNode } from "react";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Layers, PackageCheck, ArrowRight } from "lucide-react";

import { STUDIO_HOME_HREF, type StudioMetricsSnapshot } from "../data";
import { pluralize } from "../format";

/**
 * ProjectsPulseCard — surfaces the viewer's live studio project pulse:
 * how many projects are active (not delivered / archived) and how many
 * deliverables the studio has shared. Both numbers come straight from
 * `loadStudioSnapshot` (the read-only port of
 * `getStudioDashboardData().metrics`); nothing is fabricated.
 *
 * Empty state: typographic minimalism — when there is no active project
 * and nothing delivered, a calm one-liner instead of a zero wall.
 */
export function ProjectsPulseCard({
  snapshot,
}: {
  snapshot: StudioMetricsSnapshot;
}) {
  const { activeProjects, deliverables, totalProjects } = snapshot;
  const hasPulse = activeProjects > 0 || deliverables > 0;

  return (
    <Panel tone="raised">
      <Section
        kicker="Studio"
        headline={
          activeProjects > 0
            ? `${pluralize(activeProjects, "active project")}`
            : totalProjects > 0
              ? "No projects in motion"
              : "No projects yet"
        }
        action={
          <ActionButton
            href={STUDIO_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Studio
          </ActionButton>
        }
      >
        {hasPulse ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <StudioStat
              icon={<Layers size={16} />}
              value={activeProjects}
              label="In motion"
            />
            <StudioStat
              icon={<PackageCheck size={16} />}
              value={deliverables}
              label="Deliverables shared"
            />
          </div>
        ) : (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            When a brief goes live, your project milestones and deliverables
            track here.
          </p>
        )}
      </Section>
    </Panel>
  );
}

function StudioStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
        padding: "0.75rem",
        borderRadius: "0.75rem",
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
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
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          lineHeight: 1,
          color: `var(${CSS_VARS.ink})`,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          color: `var(${CSS_VARS.inkMuted})`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
