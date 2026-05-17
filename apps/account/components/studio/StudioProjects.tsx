import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import { formatAccountTemplate, type AccountCopy } from "@henryco/i18n";

import {
  formatStamp,
  projectKind,
  type ProjectKind,
  type ProjectRow,
} from "./helpers";

type StudioCopy = AccountCopy["divisionStudio"];

type Props = {
  projects: ReadonlyArray<ProjectRow>;
  copy: StudioCopy;
  limit?: number;
};

function kindLabel(kind: ProjectKind, copy: StudioCopy): string {
  const labels = copy.projectKindLabels;
  if (kind === "live") return labels.live;
  if (kind === "ready_review") return labels.ready_review;
  if (kind === "scheduled") return labels.scheduled;
  if (kind === "delivered") return labels.delivered;
  return labels.issue;
}

export function StudioProjects({ projects, copy, limit = 6 }: Props) {
  const rows = projects.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-stu__projects" role="list" aria-label={copy.projects.listAriaLabel}>
      {rows.map((project) => {
        const kind = projectKind(project.status);
        const stamp = formatStamp(project.latestUpdate?.createdAt || project.updatedAt);
        const kindText = kindLabel(kind, copy);
        const subtitle =
          project.nextAction || project.latestUpdate?.summary || copy.projects.fallbackSubtitle;
        const milestones = formatAccountTemplate(copy.projects.milestonesTemplate, {
          approved: project.approvedMilestones,
          total: project.totalMilestones || 0,
        });
        const paymentsLine = formatAccountTemplate(
          project.openPayments === 1
            ? copy.projects.paymentsTemplateSingular
            : copy.projects.paymentsTemplatePlural,
          { count: project.openPayments },
        );
        const deliverablesLine = formatAccountTemplate(
          project.deliverables === 1
            ? copy.projects.deliverablesTemplateSingular
            : copy.projects.deliverablesTemplatePlural,
          { count: project.deliverables },
        );
        const updated = formatAccountTemplate(copy.projects.updatedTemplate, { stamp });
        const ariaLabel = formatAccountTemplate(copy.projects.rowAriaLabelTemplate, {
          title: project.title,
          kind: kindText,
        });

        return (
          <Link
            key={project.id}
            href={`/studio/projects/${project.id}`}
            className="acct-stu__project-row"
            role="listitem"
            aria-label={ariaLabel}
          >
            <span className="acct-stu__project-icon" data-kind={kind} aria-hidden>
              <FolderOpen size={16} />
            </span>
            <div className="acct-stu__project-meta">
              <div className="acct-stu__project-titlebar">
                <span className="acct-stu__project-title">{project.title}</span>
                <span className="acct-stu__chip" data-kind={kind}>
                  {kindText}
                </span>
              </div>
              <p className="acct-stu__project-sub">{subtitle}</p>
              <div className="acct-stu__progress" aria-hidden>
                <div
                  className="acct-stu__progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, project.milestoneProgress))}%` }}
                />
              </div>
              <div className="acct-stu__project-foot">
                <span>{milestones}</span>
                <span>·</span>
                <span>{paymentsLine}</span>
                <span>·</span>
                <span>{deliverablesLine}</span>
                <span className="acct-stu__project-foot-spacer" />
                <span>{updated}</span>
              </div>
            </div>
            <ChevronRight size={14} aria-hidden className="acct-stu__project-chevron" />
          </Link>
        );
      })}
    </div>
  );
}
