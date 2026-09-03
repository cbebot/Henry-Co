import { translateSurfaceLabel } from "@henryco/i18n/server";
import { publishAcademyAnnouncementAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerSettingsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "support"], "/owner/settings");
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Settings")}
      title={t("Announcements, academy support posture, and publishing controls.")}
      description={t("This is where academy-wide announcements and publishing controls stay visible instead of getting buried inside a broad operations view.")}
      nav={ownerNav("/owner/settings", t)}
    >
      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Academy announcement")}</h3>
        <form action={publishAcademyAnnouncementAction} className="mt-5 grid gap-4">
          <input name="title" placeholder={t("Announcement title")} className="learn-input rounded-2xl px-4 py-3" required />
          <textarea name="body" placeholder={t("Announcement body")} className="learn-textarea rounded-2xl px-4 py-3" rows={5} required />
          <select name="audience" className="learn-select rounded-2xl px-4 py-3">
            <option value="all_active_learners">{t("All active learners")}</option>
            <option value="internal_learners">{t("Internal learners only")}</option>
          </select>
          <div>
            <PendingSubmitButton pendingLabel={t("Sending announcement...")}>{t("Send announcement")}</PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
