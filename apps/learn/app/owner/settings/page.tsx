import { publishAcademyAnnouncementAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { ownerNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerSettingsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "support"], "/owner/settings");

  return (
    <LearnWorkspaceShell
      kicker="Settings"
      title="Announcements, academy support posture, and publishing controls."
      description="The academy settings area is where broadcast communication and publishing-side adjustments live, rather than being buried inside a generic dashboard."
      nav={ownerNav("/owner/settings")}
    >
      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Academy announcement</h3>
        <form action={publishAcademyAnnouncementAction} className="mt-5 grid gap-4">
          <input name="title" placeholder="Announcement title" className="learn-input rounded-2xl px-4 py-3" required />
          <textarea name="body" placeholder="Announcement body" className="learn-textarea rounded-2xl px-4 py-3" rows={5} required />
          <select name="audience" className="learn-select rounded-2xl px-4 py-3">
            <option value="all_active_learners">All active learners</option>
            <option value="internal_learners">Internal learners only</option>
          </select>
          <div>
            <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Send announcement</button>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
