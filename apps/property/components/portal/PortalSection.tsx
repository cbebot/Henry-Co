import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * PortalSection — editorial-premium content section: kicker rail +
 * serif headline + optional meta. Used on the home and lookup
 * surfaces to anchor each band consistently. Mirrors logistics'
 * PortalSection shape (Wave B3) under .prp-pf paint.
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
      className="prp-pf__section"
      aria-labelledby={headingId}
    >
      <div className="prp-pf__section-head">
        <div>
          <span className="prp-pf__section-kicker">{kicker}</span>
          <h2 id={headingId} className="prp-pf__section-title">
            {title}
          </h2>
        </div>
        {meta ? <span className="prp-pf__section-meta">{meta}</span> : null}
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
    <ul className="prp-pf__list">
      {items.map(({ icon: Icon, title, body, status }) => (
        <li key={title}>
          <span className="prp-pf__list-icon" aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="prp-pf__list-title">{title}</h3>
            <p className="prp-pf__list-body">{body}</p>
          </div>
          {status ? (
            <span className="prp-pf__list-status" data-tone={status.tone ?? "neutral"}>
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
 * PortalLaneGrid — fewer, denser opinionated cards for any service rail.
 * NEVER more than 4 in a row.
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
    <div className="prp-pf__lanes" role="list" aria-label="Property lanes">
      {clipped.map((lane) => (
        <a key={lane.href} className="prp-pf__lane" href={lane.href} role="listitem">
          <span className="prp-pf__lane-badge">{lane.badge}</span>
          <h3 className="prp-pf__lane-title">{lane.title}</h3>
          <p className="prp-pf__lane-body">{lane.body}</p>
          <div className="prp-pf__lane-foot">
            <span>Promise</span>
            <span className="prp-pf__lane-promise">{lane.promise}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
