import { buildUnifiedViewer } from "@henryco/auth/server";
import { getCalendarAggregate, defaultCalendarRange } from "@henryco/data";
import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";

import "@/components/calendar/editorial.css";
import { CalendarHero } from "@/components/calendar/CalendarHero";
import { CalendarAgenda } from "@/components/calendar/CalendarAgenda";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendar · HenryCo",
  description:
    "Cross-portal agenda — care bookings, property viewings, jobs interviews, studio milestones, learn classes, logistics windows.",
};

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
  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const now = new Date();
  const range = defaultCalendarRange(now);
  const aggregate = await getCalendarAggregate(viewer, range);

  return (
    <div className="acct-cal acct-fade-in">
      <RouteLiveRefresh intervalMs={30000} />
      <CalendarHero aggregate={aggregate} nowMs={now.getTime()} />
      <section aria-labelledby="acct-cal-agenda">
        <div className="acct-cal__section-head">
          <h2 id="acct-cal-agenda" className="acct-cal__section-title">
            Agenda
          </h2>
          <span className="acct-cal__section-meta">
            {aggregate.events.length === 0
              ? "Nothing scheduled in the 28-day window"
              : `${aggregate.events.length} event${aggregate.events.length === 1 ? "" : "s"} · next 28 days`}
          </span>
        </div>
        {aggregate.events.length === 0 ? (
          <div className="acct-cal__empty" role="status">
            <p className="acct-cal__empty-eyebrow">Calendar quiet</p>
            <h3 className="acct-cal__empty-title">
              Nothing scheduled in the next 28 days.
            </h3>
            <p className="acct-cal__empty-body">
              Anything you book — a care pickup, a property viewing, a hiring
              interview, a learn class, a studio milestone, a logistics window —
              will land in this agenda automatically. Filter chips will appear
              once portals begin scheduling.
            </p>
          </div>
        ) : (
          <CalendarAgenda events={aggregate.events} nowMs={now.getTime()} />
        )}
      </section>
    </div>
  );
}
