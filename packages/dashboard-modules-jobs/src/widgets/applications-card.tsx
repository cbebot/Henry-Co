import type { ReactNode } from "react";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Briefcase, Bell, ArrowRight } from "lucide-react";
import { JOBS_HOME_HREF, type JobsSnapshot } from "../data";

const RECRUITER_UPDATES_LABEL = "Recruiter updates";

/**
 * ApplicationsInMotionCard — the lead jobs widget.
 *
 * Surfaces two real metrics read from the live jobs tables:
 *   - `applicationsCount`     (stats id `applications`)
 *   - `recruiterUpdatesCount` (stats id `updates`)
 *
 * No fabricated trend / comparison numbers — just the honest live
 * counts. The whole card deep-links to the live `/jobs` surface where
 * each application and recruiter update is rendered in full.
 */
export function ApplicationsInMotionCard({
  snapshot,
}: {
  snapshot: JobsSnapshot;
}) {
  const { applicationsCount, recruiterUpdatesCount } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="In motion"
        headline={
          applicationsCount > 0
            ? `${applicationsCount} active application${applicationsCount === 1 ? "" : "s"}`
            : "No active applications"
        }
        action={
          <ActionButton
            href={JOBS_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open jobs
          </ActionButton>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <Stat
            icon={<Briefcase size={16} />}
            value={String(applicationsCount)}
            label="Applications"
            hint={
              applicationsCount > 0
                ? "Tracked across every stage."
                : "Apply to a role to start tracking it here."
            }
          />
          <Stat
            icon={<Bell size={16} />}
            value={String(recruiterUpdatesCount)}
            label={RECRUITER_UPDATES_LABEL}
            hint={
              recruiterUpdatesCount > 0
                ? "Latest movement on your pipeline."
                : "Updates from recruiters land here."
            }
          />
        </div>
      </Section>
    </Panel>
  );
}

function Stat({
  icon,
  value,
  label,
  hint,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
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
          fontSize: "1.75rem",
          fontWeight: 600,
          lineHeight: 1.1,
          color: `var(${CSS_VARS.ink})`,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: `var(${CSS_VARS.inkMuted})`,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "0.75rem", color: `var(${CSS_VARS.inkSoft})` }}>
        {hint}
      </span>
    </div>
  );
}
