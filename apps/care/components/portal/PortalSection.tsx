import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * PortalSection — editorial-premium content section: kicker rail +
 * serif headline + optional meta. Used on the home and tracking
 * surfaces to anchor each band consistently.
 *
 * V3 Wave B1 mirror of apps/logistics/components/portal/PortalSection.tsx.
 */
type PortalSectionProps = {
  kicker: string;
  title: string;
  meta?: string;
  children: ReactNode;
  id?: string;
};

export function PortalSection({ kicker, title, meta, children, id }: PortalSectionProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      className="care-pf__section"
      aria-labelledby={headingId}
    >
      <div className="care-pf__section-head">
        <div>
          <span className="care-pf__section-kicker">{kicker}</span>
          <h2 id={headingId} className="care-pf__section-title">
            {title}
          </h2>
        </div>
        {meta ? <span className="care-pf__section-meta">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * PortalDividedList — denser-than-cards hairline-ruled rows. Use this
 * instead of card walls (anti-pattern: 12+ identical tiles).
 */
export type PortalDividedListItem = {
  icon: LucideIcon;
  title: string;
  body: string;
  status?: { label: string; tone?: "active" | "good" | "warn" | "neutral" };
};

export function PortalDividedList({ items }: { items: PortalDividedListItem[] }) {
  return (
    <ul className="care-pf__list">
      {items.map(({ icon: Icon, title, body, status }) => (
        <li key={title}>
          <span className="care-pf__list-icon" aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="care-pf__list-title">{title}</h3>
            <p className="care-pf__list-body">{body}</p>
          </div>
          {status ? (
            <span className="care-pf__list-status" data-tone={status.tone ?? "neutral"}>
              {status.label}
            </span>
          ) : (
            <span aria-hidden />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * PortalLaneGrid — fewer, denser opinionated cards for the services rail.
 * NEVER more than 4 in a row. Used for Care's three signature lanes
 * (wash & fold / dry clean / linen + home/office cleaning).
 */
export type PortalLaneCard = {
  badge: string;
  title: string;
  body: string;
  promise: string;
  href: string;
};

export function PortalLaneGrid({ lanes }: { lanes: PortalLaneCard[] }) {
  const clipped = lanes.slice(0, 4);
  return (
    <div className="care-pf__lanes" role="list" aria-label="Care service lanes">
      {clipped.map((lane) => (
        <a key={lane.href + lane.title} className="care-pf__lane" href={lane.href} role="listitem">
          <span className="care-pf__lane-badge">{lane.badge}</span>
          <h3 className="care-pf__lane-title">{lane.title}</h3>
          <p className="care-pf__lane-body">{lane.body}</p>
          <div className="care-pf__lane-foot">
            <span>Promise</span>
            <span className="care-pf__lane-promise">{lane.promise}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
