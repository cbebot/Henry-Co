import { Bell } from "lucide-react";

import { formatAccountTemplate, type AccountCopy } from "@henryco/i18n";

type DivisionRow = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type NotificationsCopy = AccountCopy["notifications"];

type Props = {
  totalUnread: number;
  totalToday: number;
  totalThisWeek: number;
  divisions: ReadonlyArray<DivisionRow>;
  lastActivity: string | null;
  copy: NotificationsCopy;
};

function formatRelative(iso: string | null, copy: NotificationsCopy["hero"]): string {
  if (!iso) return copy.lastActivityFallback;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return copy.lastActivityFallback;
  const delta = Date.now() - ms;
  if (delta < 60_000) return copy.justNow;
  if (delta < 3600_000) {
    return formatAccountTemplate(copy.minutesAgo, { count: Math.round(delta / 60_000) });
  }
  if (delta < 86_400_000) {
    return formatAccountTemplate(copy.hoursAgo, { count: Math.round(delta / 3_600_000) });
  }
  return formatAccountTemplate(copy.daysAgo, { count: Math.round(delta / 86_400_000) });
}

function headlineForState(totalUnread: number, copy: NotificationsCopy["hero"]): string {
  if (totalUnread === 0) return copy.headlineZero;
  if (totalUnread === 1) return copy.headlineOne;
  if (totalUnread < 5) return formatAccountTemplate(copy.headlineFew, { count: totalUnread });
  return formatAccountTemplate(copy.headlineMany, { count: totalUnread });
}

function blurbForState(
  totalUnread: number,
  totalToday: number,
  copy: NotificationsCopy["hero"],
): string {
  if (totalUnread === 0) return copy.blurbZero;
  if (totalToday === 0) return copy.blurbStale;
  return formatAccountTemplate(copy.blurbToday, { count: totalToday });
}

export function NotificationsHero({
  totalUnread,
  totalToday,
  totalThisWeek,
  divisions,
  lastActivity,
  copy,
}: Props) {
  const heroCopy = copy.hero;
  return (
    <section className="acct-notif__hero" aria-label={heroCopy.ariaOverview}>
      <div className="acct-notif__hero-inner">
        <div>
          <span className="acct-notif__eyebrow">
            <span className="acct-notif__eyebrow-dot" aria-hidden />
            {heroCopy.eyebrow}
          </span>
          <h1 className="acct-notif__headline">{headlineForState(totalUnread, heroCopy)}</h1>
          <p className="acct-notif__blurb">{blurbForState(totalUnread, totalToday, heroCopy)}</p>
          <div className="acct-notif__hero-tiles" role="list" aria-label={heroCopy.ariaVolume}>
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">{heroCopy.tileUnreadLabel}</span>
              <span className="acct-notif__hero-tile-value">{totalUnread}</span>
              <span className="acct-notif__hero-tile-foot">{heroCopy.tileUnreadFoot}</span>
            </div>
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">{heroCopy.tileTodayLabel}</span>
              <span className="acct-notif__hero-tile-value">{totalToday}</span>
              <span className="acct-notif__hero-tile-foot">{heroCopy.tileTodayFoot}</span>
            </div>
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">{heroCopy.tileWeekLabel}</span>
              <span className="acct-notif__hero-tile-value">{totalThisWeek}</span>
              <span className="acct-notif__hero-tile-foot">
                {formatAccountTemplate(heroCopy.tileWeekFoot, {
                  when: formatRelative(lastActivity, heroCopy),
                })}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-notif__hero-side" aria-label={heroCopy.ariaByDivision}>
          {divisions.length > 0 ? (
            <div className="acct-notif__hero-divisions">
              <p className="acct-notif__hero-divisions-label">{heroCopy.byDivision}</p>
              {divisions.map((d) => (
                <div className="acct-notif__hero-division-row" key={d.key}>
                  <span className="acct-notif__hero-division-name">
                    <span
                      className="acct-notif__hero-division-dot"
                      style={{ background: d.color }}
                      aria-hidden
                    />
                    {d.label}
                  </span>
                  <span className="acct-notif__hero-division-count">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="acct-notif__hero-divisions">
              <p className="acct-notif__hero-divisions-label">{heroCopy.byDivision}</p>
              <span
                style={{
                  fontSize: 13,
                  color: "color-mix(in srgb, var(--acct-bg-soft) 70%, transparent)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bell size={14} aria-hidden />
                {heroCopy.emptyDivisions}
              </span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
