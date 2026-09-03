import Link from "next/link";
import { Trash2 } from "lucide-react";

import { getAccountCopy, formatAccountTemplate } from "@henryco/i18n";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  HeroCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/notifications/editorial.css";
import { notificationStats } from "@/components/notifications/helpers";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";
import { NotificationsFeedEmptyState } from "@/components/notifications/NotificationsFeedEmptyState";

export const dynamic = "force-dynamic";

function formatRelative(iso: string | null, copyHero: ReturnType<typeof getAccountCopy>["notifications"]["hero"]): string {
  if (!iso) return copyHero.lastActivityFallback;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return copyHero.lastActivityFallback;
  const delta = Date.now() - ms;
  if (delta < 60_000) return copyHero.justNow;
  if (delta < 3600_000) {
    return formatAccountTemplate(copyHero.minutesAgo, {
      count: Math.round(delta / 60_000),
    });
  }
  if (delta < 86_400_000) {
    return formatAccountTemplate(copyHero.hoursAgo, {
      count: Math.round(delta / 3_600_000),
    });
  }
  return formatAccountTemplate(copyHero.daysAgo, {
    count: Math.round(delta / 86_400_000),
  });
}

/**
 * Notifications landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2C). Lifts NotificationsHero into
 * <HeroCard variant="paired" /> + a NextStepRow that surfaces "mark all as
 * read" when unread > 1.
 */
export default async function NotificationsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
  const notifCopy = copy.notifications;
  const notifications = await getNotificationFeed(user.id, 50, locale);
  const stats = notificationStats(notifications);

  // ── State picker ─────────────────────────────────────────────────
  const heroTone: "calm" | "active" | "attention" | "empty" =
    notifications.length === 0
      ? "empty"
      : stats.totalUnread >= 5
        ? "attention"
        : stats.totalUnread > 0
          ? "active"
          : "calm";

  const headline =
    stats.totalUnread === 0
      ? notifCopy.hero.headlineZero
      : stats.totalUnread === 1
        ? notifCopy.hero.headlineOne
        : stats.totalUnread < 5
          ? formatAccountTemplate(notifCopy.hero.headlineFew, { count: stats.totalUnread })
          : formatAccountTemplate(notifCopy.hero.headlineMany, { count: stats.totalUnread });

  const blurb =
    stats.totalUnread === 0
      ? notifCopy.hero.blurbZero
      : stats.totalToday === 0
        ? notifCopy.hero.blurbStale
        : formatAccountTemplate(notifCopy.hero.blurbToday, { count: stats.totalToday });

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: notifCopy.hero.tileUnreadLabel,
      value: stats.totalUnread,
      foot: notifCopy.hero.tileUnreadFoot,
      tone: stats.totalUnread > 0 ? "warning" : "default",
    },
    {
      label: notifCopy.hero.tileTodayLabel,
      value: stats.totalToday,
      foot: notifCopy.hero.tileTodayFoot,
      tone: stats.totalToday > 0 ? "active" : "default",
    },
    {
      label: notifCopy.hero.tileWeekLabel,
      value: stats.totalThisWeek,
      foot: formatAccountTemplate(notifCopy.hero.tileWeekFoot, {
        when: formatRelative(stats.lastActivity, notifCopy.hero),
      }),
    },
  ];

  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = stats.divisions.map((d) => ({
    label: d.label,
    count: d.count,
    color: d.color,
  }));

  // ── NextStepRow: mark-all-as-read when unread > 1 ────────────────
  let nextStep: React.ReactNode = null;
  if (stats.totalUnread > 1) {
    nextStep = (
      <NextStepRow
        tone={stats.totalUnread >= 5 ? "attention" : "neutral"}
        kicker={notifCopy.hero.tileUnreadLabel}
        title={notifCopy.markAllRead.label}
        detail={formatAccountTemplate(notifCopy.hero.headlineMany, {
          count: stats.totalUnread,
        })}
        href="#acct-notif-inbox"
      />
    );
  }

  return (
    <DivisionLanding
      className="acct-notif acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={notifCopy.hero.eyebrow}
          headline={headline}
          blurb={blurb}
          ariaLabel={notifCopy.hero.ariaOverview}
          ariaTilesLabel={notifCopy.hero.ariaVolume}
          tiles={tiles}
          side={{
            kicker: notifCopy.hero.byDivision,
            title: notifCopy.hero.byDivision,
            body:
              breakdown.length === 0 ? notifCopy.hero.emptyDivisions : notifCopy.hero.byDivision,
            breakdown:
              breakdown.length > 0
                ? {
                    label: notifCopy.hero.byDivision,
                    rows: breakdown,
                    ariaLabel: notifCopy.hero.ariaByDivision,
                  }
                : undefined,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-notif-inbox",
          title: notifCopy.inbox.heading,
          meta: notifCopy.inbox.meta,
          content:
            notifications.length === 0 ? (
              <NotificationsFeedEmptyState
                variant="inbox"
                copy={notifCopy.emptyState}
              />
            ) : (
              <NotificationsFeed notifications={notifications} copy={notifCopy} />
            ),
        },
      ]}
      footer={
        <>
          <RouteLiveRefresh intervalMs={12000} />
          <div className="acct-notif__footer">
            <Link
              href="/notifications/recently-deleted"
              className="acct-notif__recently-deleted"
            >
              <Trash2 size={13} aria-hidden />
              {notifCopy.footer.recentlyDeleted}
            </Link>
          </div>
        </>
      }
    />
  );
}
