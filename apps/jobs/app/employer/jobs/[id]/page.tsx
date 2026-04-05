import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getJobPostBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], `/employer/jobs/${id}`);
  const [data, job, query] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email),
    getJobPostBySlug(id, { includeUnpublished: true }),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);

  if (!job) {
    notFound();
  }

  const applicants = data.applications.filter((application) => application.jobSlug === job.slug);
  const created = query.created === "1";

  return (
    <WorkspaceShell
      area="employer"
      title="Role Detail"
      subtitle="Role settings, moderation status, and applicants in one place."
      nav={employerNav}
      activeHref="/employer/jobs"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {created ? (
          <InlineNotice
            tone="success"
            title="Role created"
            body="Your role has been created. It will appear on the public board once review is complete."
          />
        ) : null}

        <SectionCard title={job.title} body={job.summary}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label={job.moderationStatus.replace(/[_-]+/g, " ")} tone={job.moderationStatus === "approved" ? "good" : "warn"} />
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              {job.applicationCount} applicant{job.applicationCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              {job.workMode}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
              Status: <strong className="capitalize">{job.moderationStatus.replace(/[_-]+/g, " ")}</strong><br />
              Visibility: <strong>{job.isPublished ? "Live on board" : "Not yet published"}</strong><br />
              Compensation: <strong>{job.salaryLabel || "Discussed in process"}</strong>
            </div>
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
              {job.location} · {job.workMode} · {job.employmentType} · {job.seniority}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Hiring process" body="The stages and highlights attached to this role.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">Pipeline stages</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.pipelineStages.map((stage) => (
                  <span key={stage} className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                    {stage}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">Trust highlights</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.trustHighlights.map((item) => (
                  <span key={item} className="rounded-full bg-[var(--jobs-brass-soft)] px-3 py-1 text-xs font-semibold">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Applicants on this role">
          {applicants.length === 0 ? (
            <EmptyState
              kicker="Awaiting candidates"
              title="No applicants are attached to this role yet."
              body="As soon as candidates apply, they will appear here and in the employer applicant queue."
            />
          ) : (
            <div className="space-y-3">
              {applicants.slice(0, 5).map((application) => (
                <div key={application.applicationId} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{application.candidateName}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.candidateEmail || "Email not supplied"}</div>
                    </div>
                    <StatusPill label={application.stage.replace(/[_-]+/g, " ")} tone={application.stage === "rejected" ? "danger" : application.stage === "shortlisted" || application.stage === "interview" ? "warn" : "neutral"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
