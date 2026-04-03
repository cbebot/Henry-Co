import { markNotificationReadAction } from "@/lib/learn/actions";
import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { LearnEmptyState, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerNotificationsPage() {
  const viewer = await requireLearnUser("/learner/notifications");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Notifications"
      title="Academy reminders, announcements, and status updates."
      description="Messages are written into the academy store and shared HenryCo notification history so you can trust what was sent and when."
      nav={learnerNav("/learner/notifications")}
    >
      {workspace.notifications.length === 0 ? (
        <LearnEmptyState title="No notifications yet" body="Enrollment confirmations, reminders, announcements, and certificate notices will appear here." />
      ) : (
        <div className="space-y-5">
          {workspace.notifications.map((notification) => (
            <LearnPanel key={notification.id} className="rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{notification.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{notification.body}</p>
                </div>
                {!notification.readAt ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button type="submit" className="learn-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Mark read</button>
                  </form>
                ) : null}
              </div>
            </LearnPanel>
          ))}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
