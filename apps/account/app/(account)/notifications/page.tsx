import Link from "next/link";
import { Bell, Trash2 } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";
import { NotificationsFeedEmptyState } from "@/components/notifications/NotificationsFeedEmptyState";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const notifications = await getNotificationFeed(user.id, 50, locale);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <PageHeader
        title={t("Notifications")}
        description={t("Stay updated on everything across HenryCo.")}
        icon={Bell}
      />

      {notifications.length === 0 ? (
        <NotificationsFeedEmptyState variant="inbox" />
      ) : (
        <NotificationsFeed notifications={notifications} />
      )}

      <div className="flex justify-end">
        <Link
          href="/notifications/recently-deleted"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/30 hover:text-[var(--acct-ink)]"
        >
          <Trash2 size={13} />
          {t("Recently deleted")}
        </Link>
      </div>
    </div>
  );
}
