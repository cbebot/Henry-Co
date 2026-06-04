import { translateSurfaceLabel } from "@henryco/i18n/server";
import { addModuleLessonDefinitionAction, saveCourseDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { instructorNav } from "@/lib/learn/navigation";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnSectionIntro, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function InstructorCoursesPage() {
  await requireLearnRoles(
    ["academy_owner", "academy_admin", "instructor", "content_manager"],
    "/instructor/courses",
  );
  const [snapshot, locale] = await Promise.all([getLearnSnapshot(), getLearnPublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Course authoring")}
      title={t("Create courses and assemble lesson sequences.")}
      description={t(
        "Define the course metadata, then add modules + lessons. Lessons can be video, reading (markdown), quiz (assessment), or assignment (file or free-text submission).",
      )}
      nav={instructorNav("/instructor/courses", t)}
    >
      <LearnSectionIntro
        kicker={t("New course")}
        title={t("Define the syllabus")}
        body={t(
          "Every field here is a server action — saving updates the live catalogue. Keep titles plain, descriptions outcome-focused, and the syllabus tight.",
        )}
      />
      <LearnPanel className="mt-6 rounded-[1.6rem]">
        <form
          action={saveCourseDefinitionAction}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          <input
            name="title"
            placeholder={t("Course title")}
            className="learn-input rounded-2xl px-4 py-3"
            required
          />
          <input
            name="subtitle"
            placeholder={t("Subtitle")}
            className="learn-input rounded-2xl px-4 py-3"
            required
          />
          <select name="categoryId" className="learn-select rounded-2xl px-4 py-3" required>
            <option value="">{t("Select category")}</option>
            {snapshot.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="instructorId" className="learn-select rounded-2xl px-4 py-3">
            <option value="">{t("Select instructor")}</option>
            {snapshot.instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.fullName}
              </option>
            ))}
          </select>
          <select name="visibility" className="learn-select rounded-2xl px-4 py-3">
            <option value="public">{t("Public")}</option>
            <option value="internal">{t("Internal")}</option>
            <option value="private">{t("Private")}</option>
          </select>
          <select name="accessModel" className="learn-select rounded-2xl px-4 py-3">
            <option value="free">{t("Free")}</option>
            <option value="paid">{t("Paid")}</option>
            <option value="internal">{t("Internal")}</option>
            <option value="sponsored">{t("Sponsored")}</option>
          </select>
          <select name="difficulty" className="learn-select rounded-2xl px-4 py-3">
            <option value="beginner">{t("Beginner")}</option>
            <option value="intermediate">{t("Intermediate")}</option>
            <option value="advanced">{t("Advanced")}</option>
          </select>
          <input
            name="durationText"
            placeholder={t("Duration label, e.g. 2h 15m")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="estimatedMinutes"
            type="number"
            placeholder={t("Estimated minutes")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="price"
            type="number"
            placeholder={t("Price (0 for free)")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="currency"
            defaultValue="NGN"
            className="learn-input rounded-2xl px-4 py-3"
          />
          <select name="status" className="learn-select rounded-2xl px-4 py-3">
            <option value="draft">{t("Draft")}</option>
            <option value="published">{t("Published")}</option>
            <option value="archived">{t("Archived")}</option>
          </select>
          <textarea
            name="summary"
            rows={3}
            placeholder={t("Short summary")}
            className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3"
          />
          <textarea
            name="description"
            rows={5}
            placeholder={t("Long description")}
            className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3"
          />
          <input
            name="tags"
            placeholder={t("Comma-separated tags")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="prerequisites"
            placeholder={t("Prerequisites")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="outcomes"
            placeholder={t("Learning outcomes")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="featured" className="h-4 w-4" />
            {t("Featured course")}
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="certification" className="h-4 w-4" />
            {t("Awards a certificate")}
          </label>
          <div className="md:col-span-2 xl:col-span-3">
            <PendingSubmitButton pendingLabel={t("Saving course details...")}>
              {t("Save course")}
            </PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>

      <LearnSectionIntro
        className="mt-12"
        kicker={t("Add lesson")}
        title={t("Lesson editor")}
        body={t(
          "Pick a course, then add a module or extend an existing one with a new lesson. Lesson body uses markdown; video lessons reference a hosted video URL.",
        )}
      />
      <LearnPanel className="mt-6 rounded-[1.6rem]">
        <form
          action={addModuleLessonDefinitionAction}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          <select name="courseId" className="learn-select rounded-2xl px-4 py-3" required>
            <option value="">{t("Select course")}</option>
            {snapshot.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <input
            name="moduleTitle"
            placeholder={t("Module title (creates if new)")}
            className="learn-input rounded-2xl px-4 py-3"
            required
          />
          <input
            name="moduleSummary"
            placeholder={t("Module summary")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <input
            name="lessonTitle"
            placeholder={t("Lesson title")}
            className="learn-input rounded-2xl px-4 py-3"
            required
          />
          <input
            name="lessonSummary"
            placeholder={t("Lesson summary")}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <select name="lessonType" className="learn-select rounded-2xl px-4 py-3">
            <option value="reading">{t("Reading")}</option>
            <option value="video">{t("Video")}</option>
            <option value="quiz">{t("Quiz")}</option>
            <option value="resource">{t("Resource")}</option>
            <option value="workshop">{t("Workshop")}</option>
          </select>
          <input
            name="durationMinutes"
            type="number"
            placeholder={t("Duration (minutes)")}
            defaultValue={20}
            className="learn-input rounded-2xl px-4 py-3"
          />
          <textarea
            name="lessonBody"
            rows={6}
            placeholder={t("Lesson body (markdown)")}
            className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3"
          />
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="preview" className="h-4 w-4" />
            {t("Public preview")}
          </label>
          <div className="md:col-span-2 xl:col-span-3">
            <PendingSubmitButton pendingLabel={t("Saving lesson...")}>
              {t("Add lesson")}
            </PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>

      <LearnSectionIntro
        className="mt-12"
        kicker={t("Catalogue")}
        title={t("Existing courses")}
        body={t("Click a course to view enrolments, syllabus, and credentials issued so far.")}
      />
      <ul className="mt-6 space-y-3">
        {snapshot.courses.map((course) => {
          const modules = snapshot.modules.filter((m) => m.courseId === course.id);
          const lessons = snapshot.lessons.filter((l) => l.courseId === course.id);
          return (
            <li
              key={course.id}
              className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-5"
            >
              <p className="text-sm font-semibold text-[var(--learn-ink)]">{course.title}</p>
              <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">
                {modules.length} {t("modules")} · {lessons.length} {t("lessons")} ·{" "}
                {course.status}
              </p>
            </li>
          );
        })}
      </ul>
    </LearnWorkspaceShell>
  );
}
