import { saveCandidateProfileAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const viewer = await requireJobsUser("/candidate/profile");
  const data = await getCandidateDashboardData(viewer.user!.id);
  const profile = data.profile;

  return (
    <WorkspaceShell
      area="candidate"
      title="Candidate Profile"
      subtitle="Profile depth, trust signals, files, and preferences all feed the recruiter-facing confidence layer."
      nav={candidateNav}
      activeHref="/candidate/profile"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Profile editor" body="This writes directly into the live HenryCo jobs profile state, not a demo form.">
        <form action={saveCandidateProfileAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="fullName" className="jobs-input" defaultValue={profile?.fullName || viewer.user!.fullName || ""} placeholder="Full name" />
            <input name="phone" className="jobs-input" defaultValue={profile?.phone || viewer.user!.phone || ""} placeholder="Phone number" />
          </div>
          <input name="headline" className="jobs-input" defaultValue={profile?.headline || ""} placeholder="Headline" />
          <textarea name="summary" className="jobs-textarea min-h-36" defaultValue={profile?.summary || ""} placeholder="Professional summary" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="location" className="jobs-input" defaultValue={profile?.location || ""} placeholder="Location" />
            <input name="timezone" className="jobs-input" defaultValue={profile?.timezone || ""} placeholder="Timezone" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="workModes" className="jobs-input" defaultValue={profile?.workModes.join(", ") || ""} placeholder="remote, hybrid, onsite" />
            <input name="roleTypes" className="jobs-input" defaultValue={profile?.roleTypes.join(", ") || ""} placeholder="full-time, contract" />
          </div>
          <input name="preferredFunctions" className="jobs-input" defaultValue={profile?.preferredFunctions.join(", ") || ""} placeholder="Product, Operations, Marketing" />
          <input name="skills" className="jobs-input" defaultValue={profile?.skills.join(", ") || ""} placeholder="Skills" />
          <input name="portfolioLinks" className="jobs-input" defaultValue={profile?.portfolioLinks.join(", ") || ""} placeholder="Portfolio links" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="salaryExpectation" className="jobs-input" defaultValue={profile?.salaryExpectation || ""} placeholder="Salary expectation" />
            <input name="availability" className="jobs-input" defaultValue={profile?.availability || ""} placeholder="Availability" />
          </div>
          <textarea name="workHistory" className="jobs-textarea min-h-28" defaultValue={JSON.stringify(profile?.workHistory || [], null, 2)} placeholder='[{"company":"HenryCo","title":"Operations Lead"}]' />
          <textarea name="education" className="jobs-textarea min-h-24" defaultValue={JSON.stringify(profile?.education || [], null, 2)} placeholder='[{"school":"University","degree":"BSc"}]' />
          <textarea name="certifications" className="jobs-textarea min-h-24" defaultValue={JSON.stringify(profile?.certifications || [], null, 2)} placeholder='[{"name":"Project Management"}]' />
          <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Save candidate profile</button>
        </form>
      </SectionCard>
    </WorkspaceShell>
  );
}
