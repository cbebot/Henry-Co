import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Gauge, ArrowRight } from "lucide-react";
import { JOBS_HOME_HREF, type JobsSnapshot } from "../data";

/**
 * ProfileReadinessCard — surfaces `profile.trustScore` (stats id
 * `readiness`) as a real percent with its live readiness band and a
 * resume-on-file hint. The figure is computed with the same trust
 * controls the live `/jobs` page uses, so the two never disagree.
 */
export function ProfileReadinessCard({
  snapshot,
}: {
  snapshot: JobsSnapshot;
}) {
  const { profileReadiness, readinessLabel, hasResume } = snapshot;
  const pct = Math.max(0, Math.min(100, profileReadiness));

  return (
    <Panel tone="raised">
      <Section
        kicker="Profile readiness"
        headline={readinessLabel}
        action={
          <ActionButton
            href={JOBS_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Improve
          </ActionButton>
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <span
            aria-hidden
            style={{
              color: `var(${CSS_VARS.accentText})`,
              display: "inline-flex",
              alignSelf: "center",
            }}
          >
            <Gauge size={18} />
          </span>
          <span
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              lineHeight: 1,
              color: `var(${CSS_VARS.ink})`,
            }}
          >
            {pct}%
          </span>
        </div>

        <div
          role="presentation"
          style={{
            height: "0.5rem",
            borderRadius: "999px",
            backgroundColor: `var(${CSS_VARS.hairline})`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: "999px",
              backgroundColor: `var(${CSS_VARS.accentText})`,
            }}
          />
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            color: `var(${CSS_VARS.inkSoft})`,
            margin: "0.5rem 0 0",
          }}
        >
          {hasResume
            ? "Resume is on file. Keep skills and proof current to climb tiers."
            : "Add a resume and proof of work to lift your recruiter signal."}
        </p>
      </Section>
    </Panel>
  );
}
