import { Bell } from "lucide-react";

type DivisionRow = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type Props = {
  totalUnread: number;
  totalToday: number;
  totalThisWeek: number;
  divisions: ReadonlyArray<DivisionRow>;
  lastActivity: string | null;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "no recent activity";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "no recent activity";
  const delta = Date.now() - ms;
  if (delta < 60_000) return "just now";
  if (delta < 3600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return `${Math.round(delta / 86_400_000)}d ago`;
}

function headlineForState(totalUnread: number): string {
  if (totalUnread === 0) return "Inbox zero across HenryCo.";
  if (totalUnread === 1) return "One thing wants your attention.";
  if (totalUnread < 5) return `${totalUnread} notifications to triage.`;
  return `${totalUnread} updates across your divisions.`;
}

function blurbForState(totalUnread: number, totalToday: number): string {
  if (totalUnread === 0) {
    return "Anything HenryCo sends arrives here in real time — wallet, support, jobs, marketplace, care, and more.";
  }
  if (totalToday === 0) {
    return "Older items have stacked up. Swipe to archive, tap to open, or jump straight to a thread.";
  }
  return `${totalToday} arrived today. Use the filters to focus on a single division, or sweep through unread only.`;
}

export function NotificationsHero({
  totalUnread,
  totalToday,
  totalThisWeek,
  divisions,
  lastActivity,
}: Props) {
  return (
    <section className="acct-notif__hero" aria-label="Notifications overview">
      <div className="acct-notif__hero-inner">
        <div>
          <span className="acct-notif__eyebrow">
            <span className="acct-notif__eyebrow-dot" aria-hidden />
            HenryCo · live notifications
          </span>
          <h1 className="acct-notif__headline">{headlineForState(totalUnread)}</h1>
          <p className="acct-notif__blurb">{blurbForState(totalUnread, totalToday)}</p>
          <div className="acct-notif__hero-tiles" role="list" aria-label="Notification volume">
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">Unread</span>
              <span className="acct-notif__hero-tile-value">{totalUnread}</span>
              <span className="acct-notif__hero-tile-foot">Awaiting your eyes</span>
            </div>
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">Today</span>
              <span className="acct-notif__hero-tile-value">{totalToday}</span>
              <span className="acct-notif__hero-tile-foot">Arrived in the last 24h</span>
            </div>
            <div className="acct-notif__hero-tile" role="listitem">
              <span className="acct-notif__hero-tile-label">This week</span>
              <span className="acct-notif__hero-tile-value">{totalThisWeek}</span>
              <span className="acct-notif__hero-tile-foot">
                Last activity {formatRelative(lastActivity)}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-notif__hero-side" aria-label="By division">
          {divisions.length > 0 ? (
            <div className="acct-notif__hero-divisions">
              <p className="acct-notif__hero-divisions-label">By division</p>
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
              <p className="acct-notif__hero-divisions-label">By division</p>
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
                Nothing has arrived yet.
              </span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
