import { createJobPostAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerNewJobPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/jobs/new");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);
  const membership = data.memberships[0];

  return (
    <WorkspaceShell
      area="employer"
      title="Post a Role"
      subtitle="Role creation is server-side and lands in the live jobs publication table immediately."
      nav={employerNav}
      activeHref="/employer/jobs/new"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Job builder" body="Privilege level determines whether a role publishes immediately or enters moderation review.">
        <form action={createJobPostAction} className="grid gap-4">
          <input type="hidden" name="employerSlug" value={membership?.employerSlug || ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="title" className="jobs-input" placeholder="Role title" />
            <input name="slug" className="jobs-input" placeholder="Optional custom slug" />
          </div>
          <input name="subtitle" className="jobs-input" placeholder="Subtitle" />
          <textarea name="summary" className="jobs-textarea min-h-24" placeholder="Short role summary" />
          <textarea name="description" className="jobs-textarea min-h-40" placeholder="Full description" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="location" className="jobs-input" placeholder="Location" />
            <input name="category" className="jobs-input" placeholder="Category" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="workMode" className="jobs-input" placeholder="remote / hybrid / onsite" />
            <input name="employmentType" className="jobs-input" placeholder="Full-time / Contract" />
            <input name="seniority" className="jobs-input" placeholder="Seniority" />
          </div>
          <input name="team" className="jobs-input" placeholder="Team" />
          <input name="skills" className="jobs-input" placeholder="Skills" />
          <textarea name="responsibilities" className="jobs-textarea min-h-24" placeholder="Responsibilities, one per line" />
          <textarea name="requirements" className="jobs-textarea min-h-24" placeholder="Requirements, one per line" />
          <textarea name="benefits" className="jobs-textarea min-h-24" placeholder="Benefits, one per line" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="salaryMin" className="jobs-input" placeholder="Salary min" />
            <input name="salaryMax" className="jobs-input" placeholder="Salary max" />
          </div>
          <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Create role</button>
        </form>
      </SectionCard>
    </WorkspaceShell>
  );
}
