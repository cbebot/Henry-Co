import { saveCourseDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerCoursesPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "instructor"], "/owner/courses");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Courses"
      title="Manage the course catalog and internal program definitions."
      description="The course editor writes directly into the live academy store so marketing pages, learner dashboards, and internal assignments stay in sync."
      nav={ownerNav("/owner/courses")}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={saveCourseDefinitionAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input name="title" placeholder="Course title" className="learn-input rounded-2xl px-4 py-3" required />
          <input name="subtitle" placeholder="Subtitle" className="learn-input rounded-2xl px-4 py-3" required />
          <select name="categoryId" className="learn-select rounded-2xl px-4 py-3" required>
            <option value="">Select category</option>
            {snapshot.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select name="instructorId" className="learn-select rounded-2xl px-4 py-3">
            <option value="">Select instructor</option>
            {snapshot.instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>
            ))}
          </select>
          <select name="visibility" className="learn-select rounded-2xl px-4 py-3">
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="private">Private</option>
          </select>
          <select name="accessModel" className="learn-select rounded-2xl px-4 py-3">
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="internal">Internal</option>
            <option value="sponsored">Sponsored</option>
          </select>
          <select name="difficulty" className="learn-select rounded-2xl px-4 py-3">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <input name="durationText" placeholder="2h 15m" className="learn-input rounded-2xl px-4 py-3" />
          <input name="estimatedMinutes" type="number" placeholder="135" className="learn-input rounded-2xl px-4 py-3" />
          <input name="price" type="number" placeholder="0" className="learn-input rounded-2xl px-4 py-3" />
          <input name="currency" defaultValue="NGN" className="learn-input rounded-2xl px-4 py-3" />
          <select name="status" className="learn-select rounded-2xl px-4 py-3">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <textarea name="summary" placeholder="Short summary" className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3" rows={3} />
          <textarea name="description" placeholder="Long description" className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3" rows={5} />
          <input name="tags" placeholder="seller, trust, launch" className="learn-input rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-1" />
          <input name="prerequisites" placeholder="Basic catalog prepared" className="learn-input rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-1" />
          <input name="outcomes" placeholder="Launch with trust, reduce moderation loops" className="learn-input rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-1" />
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="featured" className="h-4 w-4" />
            Featured course
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="certification" className="h-4 w-4" />
            Certification course
          </label>
          <div className="md:col-span-2 xl:col-span-3">
            <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Save course</button>
          </div>
        </form>
      </LearnPanel>

      <div className="space-y-5">
        {snapshot.courses.map((course) => (
          <LearnPanel key={course.id} className="rounded-[2rem]">
            <div className="font-semibold text-[var(--learn-ink)]">{course.title}</div>
            <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{course.visibility} • {course.accessModel} • {course.status}</p>
          </LearnPanel>
        ))}
      </div>
    </LearnWorkspaceShell>
  );
}
