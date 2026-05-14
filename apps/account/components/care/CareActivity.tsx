import { CalendarCheck, ClipboardCheck, FileText, LifeBuoy, Truck } from "lucide-react";

import { formatStamp, type CareActivityRow, type CareLocale } from "./helpers";

type Props = {
  activity: ReadonlyArray<CareActivityRow>;
  locale: CareLocale;
  ariaLabel: string;
  limit?: number;
};

type IconKind = "booking" | "payment" | "review" | "support" | "generic";

const ICON_BY_KIND: Record<IconKind, typeof Truck> = {
  booking: Truck,
  payment: ClipboardCheck,
  review: CalendarCheck,
  support: LifeBuoy,
  generic: FileText,
};

function iconKindForActivity(type: string | null): IconKind {
  const t = String(type || "").toLowerCase();
  if (t.includes("payment")) return "payment";
  if (t.includes("review")) return "review";
  if (t.includes("support")) return "support";
  if (t.includes("booking")) return "booking";
  return "generic";
}

export function CareActivity({ activity, locale, ariaLabel, limit = 8 }: Props) {
  const rows = activity.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-care__activity" role="list" aria-label={ariaLabel}>
      {rows.map((row) => {
        const kind = iconKindForActivity(row.activityType);
        const Icon = ICON_BY_KIND[kind];
        const title = row.title?.trim() || (row.activityType ? row.activityType.replace(/_/g, " ") : ariaLabel);
        const sub = row.description?.trim() ?? null;
        const href = row.actionUrl?.trim() || null;
        const stamp = formatStamp(row.occurredAt, locale);

        const inner = (
          <>
            <span className="acct-care__activity-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-care__activity-meta">
              <span className="acct-care__activity-title">{title}</span>
              {sub ? <span className="acct-care__activity-sub">{sub}</span> : null}
            </div>
            <span className="acct-care__activity-stamp">{stamp}</span>
          </>
        );

        return href ? (
          <a
            key={row.id}
            href={href}
            className="acct-care__activity-row acct-care__activity-row--link"
            role="listitem"
            aria-label={`${title} · ${stamp}`}
          >
            {inner}
          </a>
        ) : (
          <div key={row.id} className="acct-care__activity-row" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
