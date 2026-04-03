import { createEmployerProfileAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerCompanyPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/company");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);
  const membership = data.memberships[0];

  return (
    <WorkspaceShell
      area="employer"
      title="Company Profile"
      subtitle="Employer onboarding, public trust presentation, and verification all start here."
      nav={employerNav}
      activeHref="/employer/company"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Employer onboarding" body="If you already have an employer membership, submitting this form updates the public company surface.">
        <form action={createEmployerProfileAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="name" className="jobs-input" defaultValue={membership?.employerName || ""} placeholder="Company name" />
            <input name="slug" className="jobs-input" defaultValue={membership?.employerSlug || ""} placeholder="company-slug" />
          </div>
          <input name="tagline" className="jobs-input" placeholder="Tagline" />
          <textarea name="description" className="jobs-textarea min-h-32" placeholder="Employer description" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="website" className="jobs-input" placeholder="Website" />
            <input name="industry" className="jobs-input" placeholder="Industry" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="locations" className="jobs-input" placeholder="Lagos, Abuja, Remote" />
            <input name="headcount" className="jobs-input" placeholder="Headcount" />
          </div>
          <input name="remotePolicy" className="jobs-input" placeholder="Remote policy" />
          <input name="culturePoints" className="jobs-input" placeholder="Culture points" />
          <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Save employer profile</button>
        </form>
      </SectionCard>
    </WorkspaceShell>
  );
}
