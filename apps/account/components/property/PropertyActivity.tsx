import { Building2, Calendar, Home, MessageCircle } from "lucide-react";

import {
  activityKind,
  activityTitle,
  formatStamp,
  type ActivityKind,
} from "./helpers";

export type PropertyActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

type Props = {
  activity: ReadonlyArray<PropertyActivityRow>;
  limit?: number;
};

const ICON_BY_KIND: Record<ActivityKind, typeof Home> = {
  inquiry: MessageCircle,
  viewing: Calendar,
  listing: Building2,
  generic: Home,
};

export function PropertyActivity({ activity, limit = 8 }: Props) {
  const rows = activity.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-prop__activity" role="list" aria-label="Property activity">
      {rows.map((row) => {
        const kind = activityKind(row.activityType);
        const Icon = ICON_BY_KIND[kind];
        const title = row.title?.trim() || activityTitle(row.activityType);
        const sub = row.description?.trim() ?? null;
        const href = row.actionUrl?.trim() || null;
        const stamp = formatStamp(row.occurredAt);

        const inner = (
          <>
            <span className="acct-prop__activity-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-prop__activity-meta">
              <span className="acct-prop__activity-title">{title}</span>
              {sub ? <span className="acct-prop__activity-sub">{sub}</span> : null}
            </div>
            <span className="acct-prop__activity-stamp">{stamp}</span>
          </>
        );

        return href ? (
          <a
            key={row.id}
            href={href}
            className="acct-prop__activity-row acct-prop__activity-row--link"
            role="listitem"
            aria-label={`${title} · ${stamp}`}
          >
            {inner}
          </a>
        ) : (
          <div key={row.id} className="acct-prop__activity-row" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
