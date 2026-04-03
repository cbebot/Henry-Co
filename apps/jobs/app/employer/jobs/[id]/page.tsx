import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getJobPostBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], `/employer/jobs/${id}`);
  const [data, job] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email),
    getJobPostBySlug(id, { includeUnpublished: true }),
  ]);

  if (!job) {
    notFound();
  }

  const applicants = data.applications.filter((application) => application.jobSlug === job.slug);

  return (
    <WorkspaceShell
      area="employer"
      title="Role Detail"
      subtitle="Role settings, moderation status, and applicants in one place."
      nav={employerNav}
      activeHref="/employer/jobs"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title={job.title} body={job.summary}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            Moderation: <strong>{job.moderationStatus}</strong><br />
            Published: <strong>{String(job.isPublished)}</strong><br />
            Applications: <strong>{applicants.length}</strong>
          </div>
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            {job.location} · {job.workMode} · {job.employmentType} · {job.seniority}
          </div>
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
