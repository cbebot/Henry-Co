import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Bookmark, ArrowRight } from "lucide-react";
import { JOBS_HOME_HREF, type JobsSnapshot } from "../data";

/**
 * SavedRolesCard — surfaces `savedJobs.length` (stats id `saved`) as a
 * real count. The shortlist itself renders on the live `/jobs` surface,
 * so the whole card deep-links there.
 */
export function SavedRolesCard({ snapshot }: { snapshot: JobsSnapshot }) {
  const { savedJobsCount } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="Shortlist"
        headline={
          savedJobsCount > 0
            ? `${savedJobsCount} saved role${savedJobsCount === 1 ? "" : "s"}`
            : "No saved roles yet"
        }
        action={
          <ActionButton
            href={JOBS_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Review
          </ActionButton>
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span
            aria-hidden
            style={{
              color: `var(${CSS_VARS.accentText})`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              backgroundColor: `var(${CSS_VARS.accentSoft})`,
              flexShrink: 0,
            }}
          >
            <Bookmark size={18} />
          </span>
          <p
            style={{
              fontSize: "0.8125rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            {savedJobsCount > 0
              ? "Your shortlist is ready for another review pass."
              : "Save roles you like to revisit and apply when ready."}
          </p>
        </div>
      </Section>
    </Panel>
  );
}
