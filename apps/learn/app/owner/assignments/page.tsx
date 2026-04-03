import { assignTrainingAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerAssignmentsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "internal_manager", "support"], "/owner/assignments");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Assignments"
      title="Assign internal training and monitor completion windows."
      description="Assignments can target a course or full path, preserve sponsor context, and trigger academy reminders automatically."
      nav={ownerNav("/owner/assignments")}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={assignTrainingAction} className="grid gap-4 md:grid-cols-2">
          <input name="email" placeholder="learner@henrycogroup.com" className="learn-input rounded-2xl px-4 py-3" required />
          <input name="assigneeRole" placeholder="care_staff, logistics_lead..." className="learn-input rounded-2xl px-4 py-3" />
          <select name="courseId" className="learn-select rounded-2xl px-4 py-3">
            <option value="">Choose course</option>
            {snapshot.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <select name="pathId" className="learn-select rounded-2xl px-4 py-3">
            <option value="">Choose path</option>
            {snapshot.paths.map((path) => (
              <option key={path.id} value={path.id}>{path.title}</option>
            ))}
          </select>
          <input name="sponsorName" placeholder="HenryCo Operations" className="learn-input rounded-2xl px-4 py-3" />
          <input name="dueAt" type="datetime-local" className="learn-input rounded-2xl px-4 py-3" />
          <textarea name="note" placeholder="Required before dispatch coverage begins..." className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={4} />
          <div className="md:col-span-2">
            <PendingSubmitButton pendingLabel="Sending assignment...">Assign training</PendingSubmitButton>
          </div>
        </form>
      </LearnPanel>

      <div className="space-y-5">
        {snapshot.assignments.map((assignment) => {
          const course = assignment.courseId ? snapshot.courses.find((item) => item.id === assignment.courseId) : null;
          const path = assignment.pathId ? snapshot.paths.find((item) => item.id === assignment.pathId) : null;
          return (
            <LearnPanel key={assignment.id} className="rounded-[2rem]">
              <div className="font-semibold text-[var(--learn-ink)]">{course?.title || path?.title}</div>
              <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{assignment.normalizedEmail} • {assignment.status} • {assignment.dueAt || "No due date"}</p>
            </LearnPanel>
          );
        })}
      </div>
    </LearnWorkspaceShell>
  );
}
