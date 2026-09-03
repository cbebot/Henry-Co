import { CheckCircle2, CreditCard, FolderOpen, MessageCircle, Package } from "lucide-react";
import {
  formatAccountTemplate,
  translateSurfaceLabel,
  type AccountCopy,
  type AppLocale,
} from "@henryco/i18n";

import { formatStamp, type StudioActivityRow } from "./helpers";

type StudioCopy = AccountCopy["divisionStudio"];

type Props = {
  activity: ReadonlyArray<StudioActivityRow>;
  ariaLabel: string;
  copy: StudioCopy;
  locale: AppLocale;
  limit?: number;
};

type IconKind = "project" | "payment" | "milestone" | "message" | "deliverable" | "generic";

const ICON_BY_KIND: Record<IconKind, typeof FolderOpen> = {
  project: FolderOpen,
  payment: CreditCard,
  milestone: CheckCircle2,
  message: MessageCircle,
  deliverable: Package,
  generic: FolderOpen,
};

function kindFor(type: string | null): IconKind {
  const t = String(type || "").toLowerCase();
  if (t.includes("milestone")) return "milestone";
  if (t.includes("payment") || t.includes("invoice") || t.includes("proof")) return "payment";
  if (t.includes("message") || t.includes("thread")) return "message";
  if (t.includes("deliverable") || t.includes("file")) return "deliverable";
  if (t.includes("project") || t.includes("proposal")) return "project";
  return "generic";
}

export function StudioActivity({ activity, ariaLabel, copy, locale, limit = 8 }: Props) {
  const rows = activity.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-stu__activity" role="list" aria-label={ariaLabel}>
      {rows.map((row) => {
        const kind = kindFor(row.activityType);
        const Icon = ICON_BY_KIND[kind];
        const rawTitle = row.title?.trim()
          || (row.activityType ? row.activityType.replace(/_/g, " ") : ariaLabel);
        const title = translateSurfaceLabel(locale, rawTitle);
        const sub = row.description?.trim()
          ? translateSurfaceLabel(locale, row.description.trim())
          : null;
        const href = row.actionUrl?.trim() || null;
        const stamp = formatStamp(row.occurredAt);
        const aria = formatAccountTemplate(copy.activity.rowAriaLabelTemplate, { title, stamp });

        const inner = (
          <>
            <span className="acct-stu__activity-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-stu__activity-meta">
              <span className="acct-stu__activity-title">{title}</span>
              {sub ? <span className="acct-stu__activity-sub">{sub}</span> : null}
            </div>
            <span className="acct-stu__activity-stamp">{stamp}</span>
          </>
        );

        return href ? (
          <a
            key={row.id}
            href={href}
            className="acct-stu__activity-row acct-stu__activity-row--link"
            role="listitem"
            aria-label={aria}
          >
            {inner}
          </a>
        ) : (
          <div key={row.id} className="acct-stu__activity-row" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
