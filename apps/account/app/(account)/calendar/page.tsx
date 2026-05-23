import { buildUnifiedViewer } from "@henryco/auth/server";
import { getCalendarAggregate, defaultCalendarRange } from "@henryco/data";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate, translateSurfaceLabel } from "@henryco/i18n";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  HeroCard,
  NextStepRow,
  DivisionLanding,
  EmptyStateCard,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/calendar/editorial.css";
import { CalendarAgenda } from "@/components/calendar/CalendarAgenda";
import {
  calendarBlurb,
  calendarHeadline,
  calendarState,
  kindLabel,
  topMix,
} from "@/components/calendar/helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale);
  return {
    title: copy.calendar.metaTitle,
    description: copy.calendar.metaDescription,
  };
}

function formatNextLabel(iso: string, nowMs: number): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const delta = ms - nowMs;
  if (delta < 0) return "now";
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h`;
  return `${Math.round(delta / 86_400_000)}d`;
}

/**
 * Calendar landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2C). Lifts CalendarHero into the
 * shared <HeroCard variant="paired" />. Adds a NextStepRow for an event in
 * the next 24 hours.
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
  const nowMs = now.getTime();
  const range = defaultCalendarRange(now);
  const aggregate = await getCalendarAggregate(viewer, range);

  const eventCount = aggregate.events.length;
  const state = calendarState(aggregate);
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;

  const next = aggregate.events.find((e) => Date.parse(e.startAt) >= nowMs);
  const nextLabel = next ? formatNextLabel(next.startAt, nowMs) : "—";

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: calendarCopy.tileEventsLabel,
      value: eventCount,
      foot: calendarCopy.tileEventsFoot,
      tone: eventCount > 0 ? "active" : "default",
    },
    {
      label: calendarCopy.tilePortalsLabel,
      value: portalsActive,
      foot:
        portalsActive === 0
          ? calendarCopy.tilePortalsFootEmpty
          : portalsActive === 1
            ? calendarCopy.tilePortalsFootSingular
            : formatAccountTemplate(calendarCopy.tilePortalsFootPlural, {
                count: portalsActive,
              }),
    },
    {
      label: calendarCopy.tileNextLabel,
      value: nextLabel,
      foot: next ? next.title : calendarCopy.tileNextEmpty,
      tone: next ? "accent" : "default",
    },
  ];

  const mix = topMix(aggregate.counts, calendarCopy);
  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = mix.map((row) => ({
    label: row.label,
    count: row.count,
    color: `var(${row.accentVar})`,
  }));

  const sideTitle =
    portalsActive === 0
      ? calendarCopy.sideTitleEmpty
      : portalsActive === 1
        ? calendarCopy.sideTitleSingular
        : formatAccountTemplate(calendarCopy.sideTitlePlural, { count: portalsActive });

  // ── NextStepRow: event in next 24 hours ──────────────────────────
  let nextStep: React.ReactNode = null;
  if (next) {
    const startMs = Date.parse(next.startAt);
    const delta = startMs - nowMs;
    if (delta <= 86_400_000) {
      const kindCopyLabel = kindLabel(next.kind, calendarCopy);
      nextStep = (
        <NextStepRow
          tone={delta <= 3_600_000 ? "attention" : "neutral"}
          kicker={kindCopyLabel}
          title={
            delta <= 0
              ? `${translateSurfaceLabel(locale, "Now")} · ${next.title}`
              : `${translateSurfaceLabel(locale, "In")} ${nextLabel} · ${next.title}`
          }
          detail={next.subtitle ?? undefined}
          href={next.href ?? "#acct-cal-agenda"}
        />
      );
    }
  }

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "packed"
        ? "attention"
        : state === "busy"
          ? "active"
          : "calm";

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
    <DivisionLanding
      className="acct-cal acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={calendarCopy.heroEyebrow}
          headline={calendarHeadline(state, aggregate, calendarCopy)}
          blurb={calendarBlurb(state, calendarCopy)}
          ariaLabel={calendarCopy.heroAriaLabel}
          ariaTilesLabel={calendarCopy.tileVolumeAriaLabel}
          tiles={tiles}
          side={{
            kicker: calendarCopy.sideLabel,
            title: sideTitle,
            body: calendarCopy.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: calendarCopy.sideLabel,
                    rows: breakdown,
                    ariaLabel: calendarCopy.sideAriaLabel,
                  }
                : undefined,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-cal-agenda",
          title: calendarCopy.agendaTitle,
          meta: sectionMeta,
          content:
            eventCount === 0 ? (
              <EmptyStateCard
                kicker={calendarCopy.emptyEyebrow}
                title={calendarCopy.emptyTitle}
                body={calendarCopy.emptyBody}
              />
            ) : (
              <CalendarAgenda
                events={aggregate.events}
                nowMs={nowMs}
                copy={calendarCopy}
                intlLocale={locale}
              />
            ),
        },
      ]}
      footer={<RouteLiveRefresh intervalMs={30000} />}
    />
  );
}
