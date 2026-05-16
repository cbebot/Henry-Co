import { CreditCard, FileText, LifeBuoy, Package, ShoppingBag } from "lucide-react";

import { formatStamp, type MarketActivityRow } from "./helpers";

type Props = {
  activity: ReadonlyArray<MarketActivityRow>;
  ariaLabel: string;
  dash: string;
  limit?: number;
};

type IconKind = "order" | "payment" | "dispute" | "support" | "generic";

const ICON_BY_KIND: Record<IconKind, typeof Package> = {
  order: ShoppingBag,
  payment: CreditCard,
  dispute: FileText,
  support: LifeBuoy,
  generic: Package,
};

function kindFor(type: string | null): IconKind {
  const t = String(type || "").toLowerCase();
  if (t.includes("dispute")) return "dispute";
  if (t.includes("payment") || t.includes("payout") || t.includes("refund")) return "payment";
  if (t.includes("order")) return "order";
  if (t.includes("support")) return "support";
  return "generic";
}

export function MarketplaceActivity({ activity, ariaLabel, dash, limit = 8 }: Props) {
  const rows = activity.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-mkt__activity" role="list" aria-label={ariaLabel}>
      {rows.map((row) => {
        const kind = kindFor(row.activityType);
        const Icon = ICON_BY_KIND[kind];
        const title = row.title?.trim() || (row.activityType ? row.activityType.replace(/_/g, " ") : ariaLabel);
        const sub = row.description?.trim() ?? null;
        const href = row.actionUrl?.trim() || null;
        const stamp = formatStamp(row.occurredAt, dash);

        const inner = (
          <>
            <span className="acct-mkt__activity-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-mkt__activity-meta">
              <span className="acct-mkt__activity-title">{title}</span>
              {sub ? <span className="acct-mkt__activity-sub">{sub}</span> : null}
            </div>
            <span className="acct-mkt__activity-stamp">{stamp}</span>
          </>
        );

        return href ? (
          <a
            key={row.id}
            href={href}
            className="acct-mkt__activity-row acct-mkt__activity-row--link"
            role="listitem"
            aria-label={`${title} · ${stamp}`}
          >
            {inner}
          </a>
        ) : (
          <div key={row.id} className="acct-mkt__activity-row" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
