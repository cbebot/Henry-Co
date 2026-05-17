import Link from "next/link";
import { getJobsCopy } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { employerNav } from "@/lib/jobs/navigation";
import { EmptyState } from "@/components/feedback";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerJobsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/jobs");
  const [data, locale] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email),
    getJobsPublicLocale(),
  ]);
  const copy = getJobsCopy(locale).employerJobs;

  const moderationStatusLabel = (status: string): string => {
    switch (status) {
      case "approved":
        return copy.statusApproved;
      case "pending_review":
        return copy.statusPendingReview;
      case "flagged":
        return copy.statusFlagged;
      case "draft":
        return copy.statusDraft;
      default:
        return status.replace(/[_-]+/g, " ");
    }
  };

  return (
    <WorkspaceShell
      area="employer"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={employerNav}
      activeHref="/employer/jobs"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title={copy.sectionTitle} actions={<Link href="/employer/jobs/new" className="jobs-button-primary rounded-full px-4 py-2.5 text-sm font-semibold">{copy.postRoleCta}</Link>}>
        {data.jobs.length === 0 ? (
          <EmptyState
            kicker={copy.emptyKicker}
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={
              <Link href="/employer/jobs/new" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                {copy.emptyAction}
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {data.jobs.map((job) => {
              const applicantLabel =
                job.applicationCount === 1 ? copy.applicantSingular : copy.applicantPlural;
              const roleLine = copy.roleLineTemplate
                .replace("{location}", job.location)
                .replace("{count}", String(job.applicationCount))
                .replace("{applicantLabel}", applicantLabel);
              return (
                <Link key={job.slug} href={`/employer/jobs/${job.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{job.title}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{roleLine}</div>
                    </div>
                    <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{moderationStatusLabel(job.moderationStatus)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
