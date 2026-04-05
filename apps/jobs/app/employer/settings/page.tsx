import { requireJobsRoles } from "@/lib/auth";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerSettingsPage() {
  await requireJobsRoles(["employer", "admin", "owner"], "/employer/settings");

  return (
    <WorkspaceShell
      area="employer"
      title="Employer Settings"
      subtitle="Manage your employer account preferences."
      nav={employerNav}
      activeHref="/employer/settings"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Coming soon" body="Employer settings are managed through your company profile for now.">
        <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm leading-7 text-[var(--jobs-muted)]">
          Additional billing, team management, and notification preferences will be available here soon.
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
