import { addModuleLessonDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { contentNav } from "@/lib/learn/navigation";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function ContentPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "instructor"], "/content");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Content Studio"
      title="Add modules and lessons with the full academy structure intact."
      description="Every lesson stays attached to its real course and module so progress, certificates, learner dashboards, and public pages remain in sync."
      nav={contentNav("/content")}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={addModuleLessonDefinitionAction} className="grid gap-4 md:grid-cols-2">
          <select name="courseId" className="learn-select rounded-2xl px-4 py-3" required>
            <option value="">Choose course</option>
            {snapshot.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <input name="moduleTitle" placeholder="Module title" className="learn-input rounded-2xl px-4 py-3" required />
          <input name="moduleSummary" placeholder="Module summary" className="learn-input rounded-2xl px-4 py-3 md:col-span-2" />
          <input name="lessonTitle" placeholder="Lesson title" className="learn-input rounded-2xl px-4 py-3" required />
          <input name="lessonSummary" placeholder="Lesson summary" className="learn-input rounded-2xl px-4 py-3" required />
          <select name="lessonType" className="learn-select rounded-2xl px-4 py-3">
            <option value="reading">Reading</option>
            <option value="video">Video</option>
            <option value="resource">Resource</option>
            <option value="workshop">Workshop</option>
          </select>
          <input name="durationMinutes" type="number" placeholder="25" className="learn-input rounded-2xl px-4 py-3" />
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="preview" className="h-4 w-4" />
            Preview lesson
          </label>
          <textarea name="lessonBody" placeholder="Lesson body markdown" className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={8} required />
          <div className="md:col-span-2">
            <PendingSubmitButton pendingLabel="Publishing lesson structure...">Add module and lesson</PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
