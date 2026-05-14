import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";

type Event = {
  id: string;
  title: string;
  riskLevel: string;
  deviceSummary: string;
  locationSummary: string;
  ipAddress: string | null;
  createdAt: string;
};

type Props = {
  events: ReadonlyArray<Event>;
  emptyTitle: string;
  emptyDescription: string;
  riskWord: string;
  href: (id: string) => string;
  formatDateTime: (iso: string) => string;
};

function normalizeRisk(level: string): "high" | "medium" | "low" {
  const v = String(level || "").trim().toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v as "high" | "medium" | "low";
  return "low";
}

export function ActivityList({
  events,
  emptyTitle,
  emptyDescription,
  riskWord,
  href,
  formatDateTime,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="acct-sec__activity-empty">
        <strong style={{ display: "block", color: "var(--acct-ink)", marginBottom: 6 }}>
          {emptyTitle}
        </strong>
        {emptyDescription}
      </div>
    );
  }
  return (
    <div className="acct-sec__activity" role="list" aria-label="Recent security events">
      {events.map((event) => {
        const risk = normalizeRisk(event.riskLevel);
        return (
          <Link
            key={event.id}
            href={href(event.id)}
            className="acct-sec__event"
            data-risk={risk}
            role="listitem"
          >
            <span className="acct-sec__event-icon" aria-hidden>
              <Globe size={14} aria-hidden />
            </span>
            <div className="acct-sec__event-meta">
              <div className="acct-sec__event-title-row">
                <span className="acct-sec__event-title">{event.title}</span>
                <span className="acct-sec__event-chip" data-risk={risk}>
                  {risk} {riskWord}
                </span>
              </div>
              <span className="acct-sec__event-sub">
                {event.deviceSummary} · {event.locationSummary}
              </span>
              <span className="acct-sec__event-sub">
                {event.ipAddress ? `${event.ipAddress} · ` : ""}
                {formatDateTime(event.createdAt)}
              </span>
            </div>
            <ChevronRight size={16} className="acct-sec__event-arrow" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}
