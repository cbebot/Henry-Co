import { requireJobsUser } from "@/lib/auth";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateSettingsPage() {
  await requireJobsUser("/candidate/settings");

  return (
    <WorkspaceShell
      area="candidate"
      title="Settings"
      subtitle="Manage your notification preferences and account settings."
      nav={candidateNav}
      activeHref="/candidate/settings"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Notifications" body="Control how you receive updates about your applications and alerts.">
        <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm leading-7 text-[var(--jobs-muted)]">
          Email notifications are enabled by default for application updates. You can manage job alerts from the Alerts page. Additional notification settings will be available here soon.
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
