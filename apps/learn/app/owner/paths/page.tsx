import { translateSurfaceLabel } from "@henryco/i18n/server";
import { savePathDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerPathsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "internal_manager"], "/owner/paths");
  const snapshot = await getLearnSnapshot();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Paths")}
      title={t("Sequence courses into first-class academy tracks.")}
      description={t("Learning paths let Henry Onyx Learn present capability ladders instead of loose course lists.")}
      nav={ownerNav("/owner/paths", t)}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={savePathDefinitionAction} className="grid gap-4 md:grid-cols-2">
          <input name="title" placeholder={t("Path title")} className="learn-input rounded-2xl px-4 py-3" required />
          <input name="slug" placeholder={t("Optional slug")} className="learn-input rounded-2xl px-4 py-3" />
          <input name="audience" placeholder={t("Public vendors, support managers...")} className="learn-input rounded-2xl px-4 py-3" />
          <select name="visibility" className="learn-select rounded-2xl px-4 py-3">
            <option value="public">{t("Public")}</option>
            <option value="internal">{t("Internal")}</option>
          </select>
          <select name="accessModel" className="learn-select rounded-2xl px-4 py-3">
            <option value="free">{t("Free")}</option>
            <option value="paid">{t("Paid")}</option>
            <option value="internal">{t("Internal")}</option>
            <option value="sponsored">{t("Sponsored")}</option>
          </select>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="featured" className="h-4 w-4" />
            {t("Featured path")}
          </label>
          <textarea name="summary" placeholder={t("Short summary")} className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={3} />
          <textarea name="description" placeholder={t("Path description")} className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={5} />
          <textarea name="courseIds" placeholder={snapshot.courses.map((course) => `${course.id} // ${course.title}`).join("\n")} className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={6} />
          <div className="md:col-span-2">
            <PendingSubmitButton pendingLabel={t("Saving learning path...")}>{t("Save path")}</PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>

      <div className="space-y-5">
        {snapshot.paths.map((path) => (
          <LearnPanel key={path.id} className="rounded-[2rem]">
            <div className="font-semibold text-[var(--learn-ink)]">{path.title}</div>
            <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{path.visibility} • {path.accessModel}</p>
          </LearnPanel>
        ))}
      </div>
    </LearnWorkspaceShell>
  );
}
