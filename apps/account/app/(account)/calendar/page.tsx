import { buildUnifiedViewer } from "@henryco/auth/server";
import { getCalendarAggregate, defaultCalendarRange } from "@henryco/data";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/calendar/editorial.css";
import { CalendarHero } from "@/components/calendar/CalendarHero";
import { CalendarAgenda } from "@/components/calendar/CalendarAgenda";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale);
  return {
    title: copy.calendar.metaTitle,
    description: copy.calendar.metaDescription,
  };
}

/**
 * V3 Wave A1 D4 — NET-NEW cross-portal calendar page.
 *
 * RSC entry. Pulls `getCalendarAggregate(viewer)` from `@henryco/data`
 * (server-only) which fans out across:
 *   - care_bookings
 *   - property_viewing_requests
 *   - jobs_interviews
 *   - studio_project_milestones
 *   - logistics_shipments (pickup + delivery windows)
 *   - learn_lessons
 *
 * Layout strategy:
 *   - Desktop: editorial hero band + day-grouped agenda (one card per day)
 *   - Mobile: same agenda, narrower padding, time on row line
 *
 * Wave A2 integration: when packages/rooms ships, `rooms_sessions`
 * become a first-class source — already stubbed in
 * `calendar-aggregate.ts` with a `// TODO Wave-A2` marker.
 *
 * Preview-env contract honoured by the data layer (empty aggregate on
 * missing Supabase admin env), so this page never 500s.
 */
export default async function CalendarPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const copy = getAccountCopy(locale);
  const calendarCopy = copy.calendar;
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const now = new Date();
  const range = defaultCalendarRange(now);
  const aggregate = await getCalendarAggregate(viewer, range);

  const eventCount = aggregate.events.length;
  const sectionMeta =
    eventCount === 0
      ? calendarCopy.agendaMetaEmpty
      : formatAccountTemplate(
          eventCount === 1
            ? calendarCopy.agendaMetaSingular
            : calendarCopy.agendaMetaPlural,
          { count: eventCount },
        );

  return (
    <div className="acct-cal acct-fade-in">
      <RouteLiveRefresh intervalMs={30000} />
      <CalendarHero aggregate={aggregate} nowMs={now.getTime()} copy={calendarCopy} />
      <section aria-labelledby="acct-cal-agenda">
        <div className="acct-cal__section-head">
          <h2 id="acct-cal-agenda" className="acct-cal__section-title">
            {calendarCopy.agendaTitle}
          </h2>
          <span className="acct-cal__section-meta">{sectionMeta}</span>
        </div>
        {eventCount === 0 ? (
          <div className="acct-cal__empty" role="status">
            <p className="acct-cal__empty-eyebrow">{calendarCopy.emptyEyebrow}</p>
            <h3 className="acct-cal__empty-title">{calendarCopy.emptyTitle}</h3>
            <p className="acct-cal__empty-body">{calendarCopy.emptyBody}</p>
          </div>
        ) : (
          <CalendarAgenda
            events={aggregate.events}
            nowMs={now.getTime()}
            copy={calendarCopy}
            intlLocale={locale}
          />
        )}
      </section>
    </div>
  );
}
