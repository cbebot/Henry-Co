import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";

import {
  formatStamp,
  projectKind,
  type ProjectKind,
  type ProjectRow,
} from "./helpers";

type Props = {
  projects: ReadonlyArray<ProjectRow>;
  limit?: number;
};

const KIND_LABEL: Record<ProjectKind, string> = {
  live: "Live",
  ready_review: "Ready for review",
  scheduled: "Scheduled",
  delivered: "Delivered",
  issue: "Action needed",
};

export function StudioProjects({ projects, limit = 6 }: Props) {
  const rows = projects.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-stu__projects" role="list" aria-label="Studio projects">
      {rows.map((project) => {
        const kind = projectKind(project.status);
        const stamp = formatStamp(project.latestUpdate?.createdAt || project.updatedAt);
        const subtitle = project.nextAction || project.latestUpdate?.summary || "Studio is preparing the next update.";

        return (
          <Link
            key={project.id}
            href={`/studio/projects/${project.id}`}
            className="acct-stu__project-row"
            role="listitem"
            aria-label={`${project.title} · ${KIND_LABEL[kind]}`}
          >
            <span className="acct-stu__project-icon" data-kind={kind} aria-hidden>
              <FolderOpen size={16} />
            </span>
            <div className="acct-stu__project-meta">
              <div className="acct-stu__project-titlebar">
                <span className="acct-stu__project-title">{project.title}</span>
                <span className="acct-stu__chip" data-kind={kind}>
                  {KIND_LABEL[kind]}
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
                <span>{project.approvedMilestones}/{project.totalMilestones || 0} milestones</span>
                <span>·</span>
                <span>{project.openPayments} open payment{project.openPayments === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>{project.deliverables} deliverable{project.deliverables === 1 ? "" : "s"}</span>
                <span className="acct-stu__project-foot-spacer" />
                <span>Updated {stamp}</span>
              </div>
            </div>
            <ChevronRight size={14} aria-hidden className="acct-stu__project-chevron" />
          </Link>
        );
      })}
    </div>
  );
}
