import { getDivisionUrl } from "@henryco/config";
import { getLearnSnapshot } from "@/lib/learn/data";
import {
  sendCourseNudgeNotification,
  sendInternalAssignmentNotification,
  sendProgressReminderNotification,
} from "@/lib/email/learn-templates";

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function isBeforeHours(value: string | null, hours: number, now: Date) {
  if (!value) return true;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return true;
  return now.getTime() - target.getTime() >= hours * 60 * 60 * 1000;
}

function hasRecentNotification(
  snapshot: Awaited<ReturnType<typeof getLearnSnapshot>>,
  entityId: string,
  templateKey: string,
  withinHours: number,
  now: Date
) {
  const since = new Date(now.getTime() - withinHours * 60 * 60 * 1000).toISOString();
  return snapshot.notifications.some(
    (item) =>
      item.entityId === entityId &&
      item.templateKey === templateKey &&
      item.createdAt >= since
  );
}

export async function runLearnAutomationSweep(now = new Date()) {
  const snapshot = await getLearnSnapshot();
  let progressRemindersSent = 0;
  let courseNudgesSent = 0;
  let assignmentRemindersSent = 0;
  let skipped = 0;

  for (const enrollment of snapshot.enrollments) {
    if (enrollment.status !== "active") continue;
    const course = snapshot.courses.find((item) => item.id === enrollment.courseId);
    if (!course) {
      skipped += 1;
      continue;
    }

    const audience = {
      userId: enrollment.userId,
      normalizedEmail: enrollment.normalizedEmail,
      email: enrollment.normalizedEmail,
    };
    const coursePlayerUrl = `${getDivisionUrl("learn")}/learner/courses/${course.id}`;

    if (
      enrollment.percentComplete === 0 &&
      isBeforeHours(enrollment.enrolledAt, 36, now) &&
      !hasRecentNotification(snapshot, enrollment.id, "course_nudge", 72, now)
    ) {
      await sendCourseNudgeNotification({
        audience,
        courseTitle: course.title,
        courseId: course.id,
        coursePlayerUrl,
      });
      courseNudgesSent += 1;
      continue;
    }

    if (
      enrollment.percentComplete > 0 &&
      enrollment.percentComplete < 100 &&
      isBeforeHours(enrollment.lastActivityAt || enrollment.enrolledAt, 72, now) &&
      !hasRecentNotification(snapshot, enrollment.id, "progress_reminder", 72, now)
    ) {
      await sendProgressReminderNotification({
        audience,
        courseTitle: course.title,
        courseId: course.id,
        coursePlayerUrl,
        percentComplete: enrollment.percentComplete,
      });
      progressRemindersSent += 1;
    }
  }

  for (const assignment of snapshot.assignments) {
    if (!["assigned", "in_progress", "overdue"].includes(cleanText(assignment.status))) continue;
    const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const dueSoon = dueAt && dueAt.getTime() - now.getTime() <= 48 * 60 * 60 * 1000;
    const overdue = dueAt && dueAt.getTime() < now.getTime();
    if (!dueSoon && !overdue) continue;
    if (hasRecentNotification(snapshot, assignment.id, "internal_assignment", 48, now)) continue;

    const course = assignment.courseId
      ? snapshot.courses.find((item) => item.id === assignment.courseId)
      : null;
    const path = assignment.pathId
      ? snapshot.paths.find((item) => item.id === assignment.pathId)
      : null;

    await sendInternalAssignmentNotification({
      audience: {
        userId: assignment.userId,
        normalizedEmail: assignment.normalizedEmail,
        email: assignment.normalizedEmail,
      },
      title: course?.title || path?.title || "Assigned training",
      entityId: assignment.id,
      dueAt: assignment.dueAt,
      sponsorName: assignment.sponsorName,
      note: assignment.note,
    });
    assignmentRemindersSent += 1;
  }

  return {
    progressRemindersSent,
    courseNudgesSent,
    assignmentRemindersSent,
    skipped,
    executedAt: now.toISOString(),
  };
}
