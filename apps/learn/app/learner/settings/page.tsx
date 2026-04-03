import { updateLearnerPreferencesAction } from "@/lib/learn/actions";
import { requireLearnUser } from "@/lib/learn/auth";
import { learnerNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerSettingsPage() {
  const viewer = await requireLearnUser("/learner/settings");

  return (
    <LearnWorkspaceShell
      kicker="Settings"
      title="Keep your academy identity clean and reachable."
      description="Your preferences influence reminders, announcements, and the profile data HenryCo Learn writes into future unified-account surfaces."
      nav={learnerNav("/learner/settings")}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={updateLearnerPreferencesAction} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--learn-ink)]">Full name</label>
            <input name="fullName" defaultValue={viewer.user?.fullName || ""} className="learn-input mt-2 rounded-2xl px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--learn-ink)]">Phone</label>
            <input name="phone" className="learn-input mt-2 rounded-2xl px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--learn-ink)]">Reminder channel</label>
            <select name="reminderChannel" className="learn-select mt-2 rounded-2xl px-4 py-3">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
              <input type="checkbox" name="announcementOptIn" defaultChecked className="h-4 w-4" />
              Receive academy announcements
            </label>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Save preferences</button>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
