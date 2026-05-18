import { translateSurfaceLabel } from "@henryco/i18n/server";
import { addModuleLessonDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { contentNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function ContentPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "instructor"], "/content");
  const snapshot = await getLearnSnapshot();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Content Studio")}
      title={t("Add modules and lessons with the full academy structure intact.")}
      description={t("Every lesson stays attached to its real course and module so progress, certificates, learner dashboards, and public pages remain in sync.")}
      nav={contentNav("/content", t)}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={addModuleLessonDefinitionAction} className="grid gap-4 md:grid-cols-2">
          <select name="courseId" className="learn-select rounded-2xl px-4 py-3" required>
            <option value="">{t("Choose course")}</option>
            {snapshot.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <input name="moduleTitle" placeholder={t("Module title")} className="learn-input rounded-2xl px-4 py-3" required />
          <input name="moduleSummary" placeholder={t("Module summary")} className="learn-input rounded-2xl px-4 py-3 md:col-span-2" />
          <input name="lessonTitle" placeholder={t("Lesson title")} className="learn-input rounded-2xl px-4 py-3" required />
          <input name="lessonSummary" placeholder={t("Lesson summary")} className="learn-input rounded-2xl px-4 py-3" required />
          <select name="lessonType" className="learn-select rounded-2xl px-4 py-3">
            <option value="reading">{t("Reading")}</option>
            <option value="video">{t("Video")}</option>
            <option value="resource">{t("Resource")}</option>
            <option value="workshop">{t("Workshop")}</option>
          </select>
          <input name="durationMinutes" type="number" placeholder="25" className="learn-input rounded-2xl px-4 py-3" />
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="preview" className="h-4 w-4" />
            {t("Preview lesson")}
          </label>
          <textarea name="lessonBody" placeholder={t("Lesson body markdown")} className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={8} required />
          <div className="md:col-span-2">
            <PendingSubmitButton pendingLabel={t("Publishing lesson structure...")}>{t("Add module and lesson")}</PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
