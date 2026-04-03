import { addModuleLessonDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { contentNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function ContentPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "instructor"], "/content");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Content Builder"
      title="Add modules and lessons without breaking the academy structure."
      description="This builder keeps lesson logic attached to real courses and modules so progress, certificates, and learner dashboards continue to work."
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
            <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Add module + lesson</button>
          </div>
        </form>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
