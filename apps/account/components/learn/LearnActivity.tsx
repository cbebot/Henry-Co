import { Award, BookOpen, ClipboardCheck, CreditCard, Sparkles } from "lucide-react";

import { formatStamp, type LearnActivityRow, type LearnLocale } from "./helpers";

type Props = {
  activity: ReadonlyArray<LearnActivityRow>;
  locale: LearnLocale;
  labels: {
    ariaLabel: string;
    fallbackTitle: string;
  };
  limit?: number;
};

type IconKind = "lesson" | "quiz" | "certificate" | "payment" | "generic";

const ICON_BY_KIND: Record<IconKind, typeof BookOpen> = {
  lesson: BookOpen,
  quiz: ClipboardCheck,
  certificate: Award,
  payment: CreditCard,
  generic: Sparkles,
};

function kindFor(type: string | null): IconKind {
  const t = String(type || "").toLowerCase();
  if (t.includes("certificate")) return "certificate";
  if (t.includes("quiz") || t.includes("assessment")) return "quiz";
  if (t.includes("payment") || t.includes("invoice")) return "payment";
  if (t.includes("lesson") || t.includes("module") || t.includes("course")) return "lesson";
  return "generic";
}

export function LearnActivity({ activity, locale, labels, limit = 8 }: Props) {
  const rows = activity.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-lrn__activity" role="list" aria-label={labels.ariaLabel}>
      {rows.map((row) => {
        const kind = kindFor(row.activityType);
        const Icon = ICON_BY_KIND[kind];
        const title =
          row.title?.trim() ||
          (row.activityType ? row.activityType.replace(/_/g, " ") : labels.fallbackTitle);
        const sub = row.description?.trim() ?? null;
        const href = row.actionUrl?.trim() || null;
        const stamp = formatStamp(row.occurredAt, locale);

        const inner = (
          <>
            <span className="acct-lrn__activity-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-lrn__activity-meta">
              <span className="acct-lrn__activity-title">{title}</span>
              {sub ? <span className="acct-lrn__activity-sub">{sub}</span> : null}
            </div>
            <span className="acct-lrn__activity-stamp">{stamp}</span>
          </>
        );

        return href ? (
          <a
            key={row.id}
            href={href}
            className="acct-lrn__activity-row acct-lrn__activity-row--link"
            role="listitem"
            aria-label={`${title} · ${stamp}`}
          >
            {inner}
          </a>
        ) : (
          <div key={row.id} className="acct-lrn__activity-row" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
