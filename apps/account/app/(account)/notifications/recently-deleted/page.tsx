import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getRecentlyDeletedNotificationFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import RecentlyDeletedFeed from "@/components/notifications/RecentlyDeletedFeed";

export const dynamic = "force-dynamic";

export default async function RecentlyDeletedNotificationsPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const notifications = await getRecentlyDeletedNotificationFeed(user.id, 50, locale);

  return (
    <div className="space-y-6 acct-fade-in">
      <Link
        href="/notifications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--acct-muted)] transition hover:text-[var(--acct-ink)]"
      >
        <ArrowLeft size={13} />
        {t("Back to notifications")}
      </Link>

      <PageHeader
        title={t("Recently deleted")}
        description={t(
          "Restore notifications you removed in the last 30 days, or remove them forever.",
        )}
        icon={Trash2}
      />

      <RecentlyDeletedFeed notifications={notifications} />
    </div>
  );
}
