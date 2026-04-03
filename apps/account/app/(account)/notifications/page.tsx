import { Bell, Check, CheckCheck } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getNotifications } from "@/lib/account-data";
import { timeAgo, divisionLabel, divisionColor } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAccountUser();
  const notifications = await getNotifications(user.id, 50);
  const hasUnread = notifications.some((n: Record<string, boolean>) => !n.is_read);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Notifications"
        description="Stay updated on everything across HenryCo."
        icon={Bell}
        actions={hasUnread ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. Notifications from across HenryCo services will appear here."
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {notifications.map((n: Record<string, string | boolean>) => (
            <div
              key={n.id as string}
              className={`flex items-start gap-4 px-5 py-4 ${
                !n.is_read ? "bg-[var(--acct-gold-soft)]/50" : ""
              }`}
            >
              {n.category && n.category !== "general" ? (
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: divisionColor(n.category as string) }}
                >
                  {divisionLabel(n.category as string).charAt(0)}
                </div>
              ) : (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)]">
                  <Bell size={14} className="text-[var(--acct-gold)]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"} text-[var(--acct-ink)]`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--acct-gold)]" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[var(--acct-muted)] line-clamp-2">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {n.category && n.category !== "general" && (
                    <span className="acct-chip acct-chip-gold text-[0.6rem]">
                      {divisionLabel(n.category as string)}
                    </span>
                  )}
                  <span className="text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgo(n.created_at as string)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
