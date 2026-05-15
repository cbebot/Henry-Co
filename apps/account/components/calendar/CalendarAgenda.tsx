import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { CalendarEvent } from "@henryco/data";
import { groupEventsByDay } from "@henryco/data";

import {
  KIND_ACCENT_VAR,
  KIND_LABEL,
  dayLabel,
  timeLabel,
} from "./helpers";

type Props = {
  events: ReadonlyArray<CalendarEvent>;
  /** Server-resolved "now" ms — keeps dayLabel pure. */
  nowMs: number;
};

function statusTone(status: string): "warn" | "good" | undefined {
  const v = status.toLowerCase();
  if (
    v === "scheduled" ||
    v === "pending" ||
    v === "reviewing" ||
    v === "in_progress"
  )
    return "warn";
  if (v === "completed" || v === "delivered" || v === "ended") return "good";
  return undefined;
}

/**
 * V3 Wave A1 D4 — Day-grouped agenda list. Mobile-canonical layout
 * (chronological vertical scroll). Each day is a card with its own
 * header, and each row deep-links to the originating portal entity.
 */
export function CalendarAgenda({ events, nowMs }: Props) {
  const days = groupEventsByDay(events);

  return (
    <div className="acct-cal__agenda" role="list" aria-label="Scheduled events by day">
      {days.map((day) => (
        <article
          key={day.date}
          className="acct-cal__day"
          role="listitem"
          aria-labelledby={`acct-cal-day-${day.date}`}
        >
          <header className="acct-cal__day-head">
            <h3 id={`acct-cal-day-${day.date}`} className="acct-cal__day-title">
              {dayLabel(day.date, nowMs)}
            </h3>
            <span className="acct-cal__day-meta">
              {day.items.length} event{day.items.length === 1 ? "" : "s"}
            </span>
          </header>
          <div className="acct-cal__events" role="list">
            {day.items.map((event) => (
              <Link
                key={event.key}
                href={event.href}
                className="acct-cal__event"
                role="listitem"
              >
                <span
                  className="acct-cal__event-accent"
                  aria-hidden
                  style={{ background: `var(${KIND_ACCENT_VAR[event.kind]})` }}
                />
                <span className="acct-cal__event-time" aria-label="Event time">
                  <span className="acct-cal__event-time-start">
                    {timeLabel(event.startAt)}
                  </span>
                  {event.endAt ? (
                    <span>– {timeLabel(event.endAt)}</span>
                  ) : null}
                </span>
                <div className="acct-cal__event-body">
                  <div className="acct-cal__event-head">
                    <span className="acct-cal__event-kind">
                      {KIND_LABEL[event.kind]}
                    </span>
                    <span
                      className="acct-cal__event-status"
                      data-tone={statusTone(event.status)}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="acct-cal__event-title">{event.title}</p>
                  {event.subtitle ? (
                    <p className="acct-cal__event-subtitle">{event.subtitle}</p>
                  ) : null}
                </div>
                <span className="acct-cal__event-meta">
                  <span className="acct-cal__event-cta">Open</span>
                  <ChevronRight size={14} aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
